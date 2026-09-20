import os
from pydantic import BaseModel
from typing import List, Dict

class FlexibleLoadConfig(BaseModel):
    id: str
    name: str
    power_kw: float
    duration_hours: int
    allowed_start: int  # 0-23
    allowed_end: int    # 0-23
    is_critical: bool = False

class TariffSlot(BaseModel):
    name: str
    start_hour: int
    end_hour: int
    rate_per_kwh: float  # INR per kWh
    color: str

class AppConfig:
    # Default Pune Location
    LATITUDE: float = 18.5204
    LONGITUDE: float = 73.8567
    
    # Financial & Grid Assumptions
    DEFAULT_DEMAND_CHARGE_PER_KW: float = 250.0  # INR per peak kW
    DEFAULT_CARBON_FACTOR_KG_PER_KWH: float = 0.72  # kg CO2 / kWh
    DEFAULT_SOLAR_CAPACITY_KW: float = 10.0  # Solar PV size in kW
    
    # Stretch Feature: Battery Energy Storage System (BESS)
    DEFAULT_BATTERY_CAPACITY_KWH: float = 15.0  # 15 kWh battery pack
    DEFAULT_BATTERY_MAX_POWER_KW: float = 5.0    # 5 kW max charge/discharge
    DEFAULT_BATTERY_EFFICIENCY: float = 0.92     # 92% roundtrip efficiency
    
    # Default Time-Of-Day Tariffs
    DEFAULT_TARIFF_SLOTS: List[Dict] = [
        {"name": "Off-Peak", "start_hour": 22, "end_hour": 6, "rate_per_kwh": 4.5, "color": "#10B981"},  # Green
        {"name": "Normal", "start_hour": 6, "end_hour": 17, "rate_per_kwh": 7.0, "color": "#3B82F6"},    # Blue
        {"name": "Peak", "start_hour": 17, "end_hour": 21, "rate_per_kwh": 11.0, "color": "#EF4444"},   # Red
        {"name": "Normal", "start_hour": 21, "end_hour": 22, "rate_per_kwh": 7.0, "color": "#3B82F6"}    # Blue
    ]
    
    # Default Flexible Loads (Commercial/Campus context - 4 load types)
    DEFAULT_FLEXIBLE_LOADS: List[Dict] = [
        {
            "id": "water_pump",
            "name": "Overhead Water Pump",
            "power_kw": 3.5,
            "duration_hours": 2,
            "allowed_start": 6,
            "allowed_end": 18,
            "is_critical": False,
            "default_start": 18  # currently runs during evening peak
        },
        {
            "id": "laundry_washing",
            "name": "Commercial Laundry",
            "power_kw": 5.0,
            "duration_hours": 3,
            "allowed_start": 8,
            "allowed_end": 20,
            "is_critical": False,
            "default_start": 17  # currently runs during evening peak
        },
        {
            "id": "ev_charger",
            "name": "Fleet EV Fast Charger",
            "power_kw": 7.4,
            "duration_hours": 4,
            "allowed_start": 12,
            "allowed_end": 24,
            "is_critical": False,
            "default_start": 19  # currently runs during peak
        },
        {
            "id": "water_heater",
            "name": "Hostel Central Geyser",
            "power_kw": 4.0,
            "duration_hours": 2,
            "allowed_start": 4,
            "allowed_end": 11,
            "is_critical": False,
            "default_start": 7  # morning peak
        }
    ]
    
    # Critical loads (Immutable - never rescheduled)
    CRITICAL_LOADS: List[Dict] = [
        {"id": "servers", "name": "IT Server Room & Network", "power_kw": 6.0, "is_critical": True},
        {"id": "lighting", "name": "Security & Emergency Lighting", "power_kw": 2.5, "is_critical": True}
    ]

config = AppConfig()
