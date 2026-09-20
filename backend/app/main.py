import copy
import asyncio
import json
import random
from fastapi import FastAPI, HTTPException, Body, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List

from app.config import config
from app.database import init_db, add_audit_log, get_audit_logs, clear_audit_logs
from app.data_loader import generate_synthetic_load_dataset
from app.forecast_model import EnergyForecaster
from app.optimizer import SmartDemandOptimizer
from app.schemas import (
    OptimizeWeightsInput,
    ScheduleActionInput,
    ScenarioSimulateInput,
    ConfigUpdateInput
)

app = FastAPI(
    title="GridSathi AI Energy Forecasting & Demand Scheduling API",
    description="Decision-support API for small commercial buildings, campuses, and microgrids.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_headers=["*"],
)

# Global State Container
class AppState:
    def __init__(self):
        self.solar_capacity_kw = config.DEFAULT_SOLAR_CAPACITY_KW
        self.demand_charge_per_kw = config.DEFAULT_DEMAND_CHARGE_PER_KW
        self.carbon_factor_kg_kwh = config.DEFAULT_CARBON_FACTOR_KG_PER_KWH
        self.tariff_slots = copy.deepcopy(config.DEFAULT_TARIFF_SLOTS)
        self.flexible_loads = copy.deepcopy(config.DEFAULT_FLEXIBLE_LOADS)
        self.critical_loads = copy.deepcopy(config.CRITICAL_LOADS)
        
        # BESS Parameters
        self.battery_capacity_kwh = config.DEFAULT_BATTERY_CAPACITY_KWH
        self.battery_max_power_kw = config.DEFAULT_BATTERY_MAX_POWER_KW
        
        # Current optimization weights
        self.weights = {"weight_cost": 0.4, "weight_peak": 0.4, "weight_carbon": 0.2}
        
        # User decision state: set of load IDs that are APPROVED by user
        self.approved_load_ids = set()
        
        # Cached data and forecast
        self.raw_df = None
        self.forecaster = EnergyForecaster()
        self.forecast_data = None
        self.optimizer = SmartDemandOptimizer()
        self.optimizer_result = None
        
        # Current scenario metadata
        self.active_scenario = "NORMAL"
        self.scenario_description = "Standard operational baseline"
        self.safety_margin_kw = 8.5
        self.selected_building = "Main Campus Block A"

state = AppState()

# WebSocket Connection Manager for Live IoT Stream
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.on_event("startup")
def startup_event():
    init_db()
    load_demo_state()

def get_24h_tariff_array() -> List[float]:
    tariff_array = [7.0] * 24
    for slot in state.tariff_slots:
        s = slot["start_hour"]
        e = slot["end_hour"]
        rate = slot["rate_per_kwh"]
        if s <= e:
            for h in range(s, e):
                tariff_array[h] = rate
        else:
            for h in range(s, 24):
                tariff_array[h] = rate
            for h in range(0, e):
                tariff_array[h] = rate
    return tariff_array

def run_full_pipeline(demand_mult: float = 1.0, solar_mult: float = 1.0):
    df = generate_synthetic_load_dataset(days=35, solar_capacity_kw=state.solar_capacity_kw)
    
    if demand_mult != 1.0:
        df['load_kw'] = df['load_kw'] * demand_mult
    if solar_mult != 1.0:
        df['solar_kw'] = df['solar_kw'] * solar_mult
        
    state.raw_df = df
    state.forecast_data = state.forecaster.train_and_predict_24h(df)
    
    items = state.forecast_data["forecast_items"]
    base_forecast_24h = [item["baseline_actual_kw"] for item in items]
    solar_forecast_24h = [item["solar_kw"] for item in items]
    tariff_rates_24h = get_24h_tariff_array()
    
    unflex_base = list(base_forecast_24h)
    for load in state.flexible_loads:
        def_start = load.get("default_start", load["allowed_start"])
        p = load["power_kw"]
        d = load["duration_hours"]
        for h in range(def_start, min(24, def_start + d)):
            unflex_base[h] = max(0.0, unflex_base[h] - p)
            
    state.optimizer_result = state.optimizer.optimize_schedule(
        base_forecast=unflex_base,
        solar_forecast=solar_forecast_24h,
        tariff_rates=tariff_rates_24h,
        flexible_loads=state.flexible_loads,
        demand_charge_per_kw=state.demand_charge_per_kw,
        carbon_factor_kg_kwh=state.carbon_factor_kg_kwh,
        weight_cost=state.weights["weight_cost"],
        weight_peak=state.weights["weight_peak"],
        weight_carbon=state.weights["weight_carbon"],
        approved_load_ids=list(state.approved_load_ids),
        battery_capacity_kwh=state.battery_capacity_kwh,
        battery_max_power_kw=state.battery_max_power_kw
    )

def load_demo_state():
    state.approved_load_ids = {load['id'] for load in state.flexible_loads}
    state.weights = {"weight_cost": 0.4, "weight_peak": 0.4, "weight_carbon": 0.2}
    state.active_scenario = "NORMAL"
    state.scenario_description = "Standard operational baseline"
    state.safety_margin_kw = 8.5
    clear_audit_logs()
    
    for load in state.flexible_loads:
        add_audit_log(
            device_id=load['id'],
            device_name=load['name'],
            action="APPROVED",
            original_start=load.get("default_start", load["allowed_start"]),
            proposed_start=13 if load['id'] == 'ev_charger' else 12 if load['id'] == 'water_pump' else 10,
            reason="Pre-approved demo schedule baseline"
        )
        
    run_full_pipeline()

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """Real-time IoT Telemetry Stream Endpoint."""
    await manager.connect(websocket)
    try:
        while True:
            # Emit live telemetry packet every 2 seconds
            base_kw = 32.5 + random.uniform(-1.8, 2.2)
            grid_hz = 50.0 + random.uniform(-0.04, 0.04)
            grid_v = 230.0 + random.uniform(-2.5, 2.5)
            solar_live = 6.8 + random.uniform(-0.5, 0.5)
            
            telemetry_packet = {
                "type": "IOT_TELEMETRY",
                "timestamp_ms": int(asyncio.get_event_loop().time() * 1000),
                "grid_frequency_hz": round(grid_hz, 2),
                "line_voltage_v": round(grid_v, 1),
                "active_power_kw": round(base_kw, 2),
                "solar_power_kw": round(solar_live, 2),
                "battery_soc_pct": round(68.4 + random.uniform(-0.2, 0.2), 1),
                "relays": {
                    "water_pump": "ONLINE_NORMAL",
                    "laundry": "STANDBY_SCHEDULED",
                    "ev_charger": "OPTIMIZED_SLOT",
                    "geyser": "ONLINE_NORMAL"
                }
            }
            await websocket.send_json(telemetry_packet)
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.post("/api/demo/load")
def trigger_demo_load():
    load_demo_state()
    return get_dashboard_data()

@app.get("/api/dashboard")
def get_dashboard_data():
    if state.forecast_data is None or state.optimizer_result is None:
        run_full_pipeline()
        
    items = state.forecast_data["forecast_items"]
    schedule = state.optimizer_result["proposed_schedule"]
    baseline_curve = state.optimizer_result["baseline_load_curve"]
    proposed_curve = state.optimizer_result["proposed_load_curve"]
    final_net_curve = state.optimizer_result.get("final_proposed_net_curve", proposed_curve)
    battery_series = state.optimizer_result.get("battery_series", [])
    tariff_array = get_24h_tariff_array()
    
    chart_series = []
    for i in range(24):
        item = items[i]
        bat_info = battery_series[i] if i < len(battery_series) else {"charge_kw": 0, "discharge_kw": 0, "soc_pct": 30.0}
        chart_series.append({
            "hour": item["hour"],
            "time_label": f"{item['hour']:02d}:00",
            "baseline_load_kw": baseline_curve[i],
            "proposed_load_kw": proposed_curve[i],
            "final_net_kw": final_net_curve[i],
            "q10_kw": item["q10_kw"],
            "q90_kw": item["q90_kw"],
            "solar_kw": item["solar_kw"],
            "temp_c": item["temp_c"],
            "tariff_rate": tariff_array[i],
            "battery_charge_kw": bat_info["charge_kw"],
            "battery_discharge_kw": bat_info["discharge_kw"],
            "battery_soc_pct": bat_info["soc_pct"]
        })
        
    return {
        "kpis": state.optimizer_result["kpis"],
        "forecast_metrics": state.forecast_data["metrics"],
        "data_freshness": state.forecast_data["data_freshness"],
        "chart_series": chart_series,
        "schedule": schedule,
        "battery_series": battery_series,
        "critical_loads": state.critical_loads,
        "anomalies": state.forecast_data.get("anomalies", []),
        "scenario": {
            "active": state.active_scenario,
            "description": state.scenario_description,
            "safety_margin_kw": state.safety_margin_kw
        },
        "config": {
            "solar_capacity_kw": state.solar_capacity_kw,
            "battery_capacity_kwh": state.battery_capacity_kwh,
            "battery_max_power_kw": state.battery_max_power_kw,
            "demand_charge_per_kw": state.demand_charge_per_kw,
            "carbon_factor_kg_kwh": state.carbon_factor_kg_kwh,
            "tariff_slots": state.tariff_slots,
            "weights": state.weights
        }
    }

@app.post("/api/optimize")
def update_optimization_weights(weights_input: OptimizeWeightsInput):
    state.weights = {
        "weight_cost": weights_input.weight_cost,
        "weight_peak": weights_input.weight_peak,
        "weight_carbon": weights_input.weight_carbon
    }
    run_full_pipeline()
    return get_dashboard_data()

@app.post("/api/schedule/action")
def toggle_schedule_action(payload: ScheduleActionInput):
    device_id = payload.device_id
    action = payload.action.upper()
    
    target_item = None
    for item in state.optimizer_result["proposed_schedule"]:
        if item["id"] == device_id:
            target_item = item
            break
            
    if not target_item:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found in current schedule")
        
    if action == "APPROVE":
        state.approved_load_ids.add(device_id)
        action_text = "APPROVED"
    elif action == "REJECT":
        state.approved_load_ids.discard(device_id)
        action_text = "REJECTED"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'APPROVE' or 'REJECT'")
        
    add_audit_log(
        device_id=device_id,
        device_name=target_item["name"],
        action=action_text,
        original_start=target_item["original_start"],
        proposed_start=target_item["proposed_start"],
        reason=target_item["reason"]
    )
    
    run_full_pipeline()
    return get_dashboard_data()

@app.get("/api/audit-log")
def fetch_audit_log():
    return {"audit_logs": get_audit_logs(limit=50)}

@app.post("/api/simulate")
def run_scenario_simulation(payload: ScenarioSimulateInput):
    scen_type = payload.scenario_type
    
    if scen_type == "SURGE_20":
        state.active_scenario = "+20% Demand Surge"
        state.scenario_description = "Sudden grid load increase (+20% consumption across building)."
        state.safety_margin_kw = 5.2
        run_full_pipeline(demand_mult=1.2, solar_mult=1.0)
    elif scen_type == "SOLAR_DROP_50":
        state.active_scenario = "Cloudy Sky (-50% Solar)"
        state.scenario_description = "Unannounced cloud cover reducing solar generation by 50%."
        state.safety_margin_kw = 6.0
        run_full_pipeline(demand_mult=1.0, solar_mult=0.5)
    elif scen_type == "HEATWAVE":
        state.active_scenario = "Extreme Heatwave (+30% HVAC Load)"
        state.scenario_description = "High ambient temp spiking cooling loads."
        state.safety_margin_kw = 4.1
        run_full_pipeline(demand_mult=1.3, solar_mult=1.1)
    else:
        state.active_scenario = "NORMAL"
        state.scenario_description = "Standard operational baseline"
        state.safety_margin_kw = 8.5
        run_full_pipeline(demand_mult=1.0, solar_mult=1.0)
        
    return get_dashboard_data()

@app.get("/api/config")
def get_app_config():
    return {
        "solar_capacity_kw": state.solar_capacity_kw,
        "battery_capacity_kwh": state.battery_capacity_kwh,
        "battery_max_power_kw": state.battery_max_power_kw,
        "demand_charge_per_kw": state.demand_charge_per_kw,
        "carbon_factor_kg_kwh": state.carbon_factor_kg_kwh,
        "tariff_slots": state.tariff_slots,
        "flexible_loads": state.flexible_loads,
        "critical_loads": state.critical_loads
    }

@app.post("/api/config")
def update_app_config(update: ConfigUpdateInput):
    if update.solar_capacity_kw is not None:
        state.solar_capacity_kw = update.solar_capacity_kw
    if update.demand_charge_per_kw is not None:
        state.demand_charge_per_kw = update.demand_charge_per_kw
    if update.carbon_factor_kg_kwh is not None:
        state.carbon_factor_kg_kwh = update.carbon_factor_kg_kwh
    if update.tariff_slots is not None:
        state.tariff_slots = [slot.dict() for slot in update.tariff_slots]
        
    run_full_pipeline()
    return get_dashboard_data()

@app.get("/api/anomalies")
def get_anomalies():
    if state.forecast_data:
        return {"anomalies": state.forecast_data.get("anomalies", [])}
    return {"anomalies": []}
