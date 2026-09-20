import os
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Tuple, Dict
from app.config import config

DATA_CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "data_cache")

def ensure_cache_dir():
    if not os.path.exists(DATA_CACHE_DIR):
        os.makedirs(DATA_CACHE_DIR, exist_ok=True)

def fetch_open_meteo_solar(lat: float = config.LATITUDE, lon: float = config.LONGITUDE, days: int = 35) -> pd.DataFrame:
    """
    Fetch live hourly solar radiation & temperature from Open-Meteo Free Weather API for Pune location.
    Falls back to NASA POWER or synthetic model if offline.
    """
    ensure_cache_dir()
    cache_file = os.path.join(DATA_CACHE_DIR, "open_meteo_solar.csv")
    
    # Check cache freshness (valid for 6 hours for real live weather)
    if os.path.exists(cache_file):
        mtime = datetime.fromtimestamp(os.path.getmtime(cache_file))
        if datetime.now() - mtime < timedelta(hours=6):
            try:
                df = pd.read_csv(cache_file)
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                return df
            except Exception:
                pass
                
    # Open-Meteo API query for past & forecast hourly solar & temperature
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=shortwave_radiation,temperature_2m,relative_humidity_2m&forecast_days=7&past_days=28"
    
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            radiations = hourly.get("shortwave_radiation", [])
            temps = hourly.get("temperature_2m", [])
            
            records = []
            for t_str, rad, tmp in zip(times, radiations, temps):
                dt = datetime.fromisoformat(t_str)
                records.append({
                    "timestamp": dt,
                    "irradiance_wm2": max(0.0, float(rad or 0.0)),
                    "temp_c": float(tmp or 28.0)
                })
            
            if records:
                df = pd.DataFrame(records).sort_values("timestamp").reset_index(drop=True)
                df.to_csv(cache_file, index=False)
                return df
    except Exception as e:
        print(f"[DataLoader] Open-Meteo API fetch exception ({e}). Falling back to synthetic solar curve.")

    return generate_synthetic_solar(days=days)

def generate_synthetic_solar(days: int = 35) -> pd.DataFrame:
    start_dt = datetime.now().replace(minute=0, second=0, microsecond=0) - timedelta(days=days)
    hours = days * 24
    records = []
    
    np.random.seed(42)
    for i in range(hours):
        dt = start_dt + timedelta(hours=i)
        hour = dt.hour
        
        if 6 <= hour <= 18:
            solar_factor = np.sin(np.pi * (hour - 6) / 12) ** 1.3
            cloud_noise = np.random.uniform(0.85, 1.05)
            irradiance = max(0.0, solar_factor * 950.0 * cloud_noise)
        else:
            irradiance = 0.0
            
        temp_factor = np.sin(np.pi * (hour - 5) / 12) if 5 <= hour <= 17 else np.cos(np.pi * ((hour - 17) % 24) / 12)
        temp_c = 26.0 + 6.0 * temp_factor + np.random.normal(0, 0.5)
        
        records.append({
            "timestamp": dt,
            "irradiance_wm2": float(irradiance),
            "temp_c": float(temp_c)
        })
        
    return pd.DataFrame(records)

def convert_solar_irradiance_to_kw(irradiance_series: pd.Series, solar_capacity_kw: float = config.DEFAULT_SOLAR_CAPACITY_KW) -> pd.Series:
    efficiency = 0.82
    return (irradiance_series / 1000.0) * solar_capacity_kw * efficiency

def generate_synthetic_load_dataset(days: int = 35, solar_capacity_kw: float = config.DEFAULT_SOLAR_CAPACITY_KW) -> pd.DataFrame:
    solar_df = fetch_open_meteo_solar(days=days)
    np.random.seed(101)
    
    records = []
    for idx, row in solar_df.iterrows():
        dt = row['timestamp']
        hour = dt.hour
        day_of_week = dt.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        temp_c = row['temp_c']
        irradiance = row['irradiance_wm2']
        
        base_load = 12.0
        
        if 8 <= hour <= 17:
            day_profile = np.sin(np.pi * (hour - 8) / 9) * 18.0
        else:
            day_profile = 0.0
            
        evening_peak = 0.0
        if 17 <= hour <= 21:
            evening_peak = np.sin(np.pi * (hour - 17) / 4) * 26.0 + 8.0
        elif 6 <= hour <= 8:
            evening_peak = 6.0
            
        hvac_load = max(0.0, (temp_c - 26.0) * 0.9)
        total_load = base_load + day_profile + evening_peak + hvac_load
        
        if is_weekend:
            total_load *= 0.78
            
        noise = np.random.normal(0, 1.8)
        total_load = max(5.0, total_load + noise)
        
        records.append({
            "timestamp": dt,
            "hour": hour,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "temp_c": round(float(temp_c), 2),
            "irradiance_wm2": round(float(irradiance), 2),
            "solar_kw": round(float(convert_solar_irradiance_to_kw(pd.Series([irradiance]), solar_capacity_kw).iloc[0]), 2),
            "load_kw": round(float(total_load), 2)
        })
        
    df = pd.DataFrame(records)
    return df
