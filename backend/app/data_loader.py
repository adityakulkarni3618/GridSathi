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

def fetch_nasa_power_solar(lat: float = config.LATITUDE, lon: float = config.LONGITUDE, days: int = 35) -> pd.DataFrame:
    """
    Fetch hourly solar irradiance (W/m2) from NASA POWER API for Pune location.
    Falls back to synthetic clear-sky model if offline or API times out.
    """
    ensure_cache_dir()
    cache_file = os.path.join(DATA_CACHE_DIR, "nasa_power_solar.csv")
    
    # Check cache freshness (valid for 1 day)
    if os.path.exists(cache_file):
        mtime = datetime.fromtimestamp(os.path.getmtime(cache_file))
        if datetime.now() - mtime < timedelta(days=1):
            try:
                df = pd.read_csv(cache_file)
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                return df
            except Exception:
                pass
                
    # Attempt NASA POWER API request
    end_date = datetime.now().strftime("%Y%m%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")
    url = f"https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=ALLSKY_SWRAD_1C,T2M&community=RE&longitude={lon}&latitude={lat}&start={start_date}&end={end_date}&format=JSON"
    
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            properties = data.get("properties", {}).get("parameter", {})
            swrad = properties.get("ALLSKY_SWRAD_1C", {})
            t2m = properties.get("T2M", {})
            
            records = []
            for dt_str, val in swrad.items():
                # Format dt_str YYYYMMDDHH
                dt = datetime.strptime(dt_str, "%Y%m%d%H")
                temp = t2m.get(dt_str, 28.0)
                # Cap negative or fill values
                irradiance = max(0.0, float(val)) if val != -999 else 0.0
                records.append({
                    "timestamp": dt,
                    "irradiance_wm2": irradiance,
                    "temp_c": float(temp) if temp != -999 else 28.0
                })
            
            if records:
                df = pd.DataFrame(records).sort_values("timestamp").reset_index(drop=True)
                df.to_csv(cache_file, index=False)
                return df
    except Exception as e:
        print(f"[DataLoader] NASA POWER API fetch failed or offline ({e}). Using synthetic clear-sky solar fallback.")

    # Synthetic Clear-Sky Fallback
    return generate_synthetic_solar(days=days)

def generate_synthetic_solar(days: int = 35) -> pd.DataFrame:
    """Generate realistic hourly clear-sky solar irradiance and temperature profile for Pune."""
    start_dt = datetime.now().replace(minute=0, second=0, microsecond=0) - timedelta(days=days)
    hours = days * 24
    records = []
    
    np.random.seed(42)
    for i in range(hours):
        dt = start_dt + timedelta(hours=i)
        hour = dt.hour
        
        # Diurnal Solar Irradiance Curve (Peaking at 13:00)
        if 6 <= hour <= 18:
            # Solar elevation sine wave approximation
            solar_factor = np.sin(np.pi * (hour - 6) / 12) ** 1.3
            # Add slight cloud variation factor
            cloud_noise = np.random.uniform(0.85, 1.05)
            irradiance = max(0.0, solar_factor * 950.0 * cloud_noise)
        else:
            irradiance = 0.0
            
        # Diurnal Temperature Curve (Min at 05:00 ~22°C, Max at 15:00 ~34°C)
        temp_factor = np.sin(np.pi * (hour - 5) / 12) if 5 <= hour <= 17 else np.cos(np.pi * ((hour - 17) % 24) / 12)
        temp_c = 26.0 + 6.0 * temp_factor + np.random.normal(0, 0.5)
        
        records.append({
            "timestamp": dt,
            "irradiance_wm2": float(irradiance),
            "temp_c": float(temp_c)
        })
        
    return pd.DataFrame(records)

def convert_solar_irradiance_to_kw(irradiance_series: pd.Series, solar_capacity_kw: float = config.DEFAULT_SOLAR_CAPACITY_KW) -> pd.Series:
    """Convert solar irradiance (W/m2) to kW power output for configured PV capacity."""
    # Standard testing condition: 1000 W/m2 = STC capacity
    # System losses / efficiency factor ~0.82
    efficiency = 0.82
    return (irradiance_series / 1000.0) * solar_capacity_kw * efficiency

def generate_synthetic_load_dataset(days: int = 35, solar_capacity_kw: float = config.DEFAULT_SOLAR_CAPACITY_KW) -> pd.DataFrame:
    """
    Generate realistic 35-day hourly load dataset for small commercial building / campus / hostel.
    Features:
    - Base continuous load (critical servers, fridge, emergency systems) ~ 12 kW
    - Daytime commercial activity bump (08:00 - 17:00) + 15 kW
    - Evening peak load (17:00 - 21:00) + 25 kW (un-optimized flexible loads: water pump, laundry, EV charger)
    - Weekend reduction (~25% lower commercial load)
    - Temperature sensitivity (HVAC load increase with high temp)
    - Realistic noise
    """
    solar_df = fetch_nasa_power_solar(days=days)
    np.random.seed(101)
    
    records = []
    for idx, row in solar_df.iterrows():
        dt = row['timestamp']
        hour = dt.hour
        day_of_week = dt.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        temp_c = row['temp_c']
        irradiance = row['irradiance_wm2']
        
        # Base demand profile
        base_load = 12.0  # continuous baseload
        
        # Daytime commercial load curve
        if 8 <= hour <= 17:
            day_profile = np.sin(np.pi * (hour - 8) / 9) * 18.0
        else:
            day_profile = 0.0
            
        # Un-optimized Evening Peak (Water pump @ 18:00, Laundry @ 17:00, EV charger @ 19:00)
        evening_peak = 0.0
        if 17 <= hour <= 21:
            evening_peak = np.sin(np.pi * (hour - 17) / 4) * 26.0 + 8.0
        elif 6 <= hour <= 8:
            evening_peak = 6.0 # Morning geyser bump
            
        # HVAC temperature factor (additional 0.8 kW per degree above 26°C)
        hvac_load = max(0.0, (temp_c - 26.0) * 0.9)
        
        # Combine loads
        total_load = base_load + day_profile + evening_peak + hvac_load
        
        # Weekend scale down
        if is_weekend:
            total_load *= 0.78
            
        # Add realistic Gaussian noise
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
