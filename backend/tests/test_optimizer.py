import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.optimizer import SmartDemandOptimizer
from app.config import config

def test_optimizer_respects_allowed_windows():
    """Verify MILP solver places flexible loads strictly within allowed start/end time windows."""
    optimizer = SmartDemandOptimizer()
    
    base_forecast = [15.0] * 24
    solar_forecast = [0.0] * 6 + [5.0] * 12 + [0.0] * 6
    tariff_rates = [4.5] * 6 + [7.0] * 11 + [11.0] * 4 + [7.0] * 3
    
    flexible_loads = [
        {
            "id": "pump_test",
            "name": "Water Pump Test",
            "power_kw": 5.0,
            "duration_hours": 2,
            "allowed_start": 8,
            "allowed_end": 16,
            "default_start": 18
        }
    ]
    
    result = optimizer.optimize_schedule(
        base_forecast=base_forecast,
        solar_forecast=solar_forecast,
        tariff_rates=tariff_rates,
        flexible_loads=flexible_loads,
        approved_load_ids=["pump_test"]
    )
    
    schedule = result["proposed_schedule"]
    assert len(schedule) == 1
    
    item = schedule[0]
    opt_start = item["proposed_start"]
    duration = item["duration_hours"]
    
    # Check bounds
    assert opt_start >= 8, f"Proposed start {opt_start} before allowed start 8"
    assert opt_start + duration <= 16, f"Proposed end {opt_start + duration} exceeds allowed end 16"
    assert result["solver_status"] == "Optimal"

def test_critical_loads_are_locked():
    """Verify critical loads in config are designated as non-reschedulable."""
    critical_ids = [load["id"] for load in config.CRITICAL_LOADS]
    assert "servers" in critical_ids
    assert "lighting" in critical_ids
    for load in config.CRITICAL_LOADS:
        assert load.get("is_critical") is True
