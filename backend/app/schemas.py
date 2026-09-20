from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class TariffSlotInput(BaseModel):
    name: str
    start_hour: int
    end_hour: int
    rate_per_kwh: float
    color: str

class FlexibleLoadInput(BaseModel):
    id: str
    name: str
    power_kw: float
    duration_hours: int
    allowed_start: int
    allowed_end: int
    default_start: int
    is_critical: bool = False

class OptimizeWeightsInput(BaseModel):
    weight_cost: float = Field(0.4, ge=0.0, le=1.0)
    weight_peak: float = Field(0.4, ge=0.0, le=1.0)
    weight_carbon: float = Field(0.2, ge=0.0, le=1.0)

class ScheduleActionInput(BaseModel):
    device_id: str
    action: str  # 'APPROVE' or 'REJECT'

class ScenarioSimulateInput(BaseModel):
    scenario_type: str  # 'SURGE_20', 'SOLAR_DROP_50', 'HEATWAVE', 'NORMAL'
    demand_multiplier: float = 1.0
    solar_multiplier: float = 1.0

class ConfigUpdateInput(BaseModel):
    solar_capacity_kw: Optional[float] = None
    demand_charge_per_kw: Optional[float] = None
    carbon_factor_kg_kwh: Optional[float] = None
    tariff_slots: Optional[List[TariffSlotInput]] = None
    flexible_loads: Optional[List[FlexibleLoadInput]] = None
