import pulp
import numpy as np
from typing import Dict, List, Any
from app.config import config

class SmartDemandOptimizer:
    def __init__(self):
        pass

    def optimize_schedule(
        self,
        base_forecast: List[float],      # 24h baseline demand curve (kW)
        solar_forecast: List[float],     # 24h solar generation curve (kW)
        tariff_rates: List[float],       # 24h electricity tariff rates (INR/kWh)
        flexible_loads: List[Dict[str, Any]], # List of flexible loads
        demand_charge_per_kw: float = config.DEFAULT_DEMAND_CHARGE_PER_KW,
        carbon_factor_kg_kwh: float = config.DEFAULT_CARBON_FACTOR_KG_PER_KWH,
        weight_cost: float = 0.4,
        weight_peak: float = 0.4,
        weight_carbon: float = 0.2,
        approved_load_ids: List[str] = None, # Loads approved by user
        battery_capacity_kwh: float = config.DEFAULT_BATTERY_CAPACITY_KWH,
        battery_max_power_kw: float = config.DEFAULT_BATTERY_MAX_POWER_KW,
        battery_efficiency: float = config.DEFAULT_BATTERY_EFFICIENCY
    ) -> Dict[str, Any]:
        """
        Formulate and solve MILP optimization problem using PuLP.
        Determines optimal start times for flexible loads AND 24h battery charge/discharge schedule
        to minimize cost, peak demand, and carbon emissions.
        """
        if approved_load_ids is None:
            approved_load_ids = [load['id'] for load in flexible_loads]
            
        prob = pulp.LpProblem("GridSathi_Smart_Demand_Scheduling", pulp.LpMinimize)
        
        hours = list(range(24))
        
        # 1. Binary Decision Variables for Flexible Loads: x[i, t] = 1 if load i starts at hour t
        x_vars = {}
        for load in flexible_loads:
            load_id = load['id']
            start_min = load['allowed_start']
            start_max = min(23, load['allowed_end'] - load['duration_hours'])
            
            if start_max < start_min:
                start_max = start_min
                
            for t in hours:
                if start_min <= t <= start_max:
                    x_vars[(load_id, t)] = pulp.LpVariable(f"start_{load_id}_h{t}", cat=pulp.LpBinary)
                else:
                    x_vars[(load_id, t)] = 0  # Forbidden outside allowed window

        # 2. Battery Decision Variables
        p_charge = {t: pulp.LpVariable(f"p_charge_h{t}", lowBound=0, upBound=battery_max_power_kw, cat=pulp.LpContinuous) for t in hours}
        p_discharge = {t: pulp.LpVariable(f"p_discharge_h{t}", lowBound=0, upBound=battery_max_power_kw, cat=pulp.LpContinuous) for t in hours}
        soc = {t: pulp.LpVariable(f"soc_h{t}", lowBound=battery_capacity_kwh * 0.1, upBound=battery_capacity_kwh * 0.95, cat=pulp.LpContinuous) for t in hours}

        # Peak Load Variable
        peak_load_var = pulp.LpVariable("Peak_Load_kW", lowBound=0, cat=pulp.LpContinuous)
        
        # Net Grid Demand Variables for each hour
        net_grid_vars = {t: pulp.LpVariable(f"net_grid_h{t}", lowBound=0, cat=pulp.LpContinuous) for t in hours}
        
        # Start Once Constraint for each flexible load
        for load in flexible_loads:
            load_id = load['id']
            start_min = load['allowed_start']
            start_max = min(23, load['allowed_end'] - load['duration_hours'])
            if start_max < start_min:
                start_max = start_min
            
            prob += (
                pulp.lpSum([x_vars[(load_id, t)] for t in range(start_min, start_max + 1)]) == 1,
                f"start_once_{load_id}"
            )
            
        # Flexible Load Hourly Demand Accumulation
        hourly_flexible_demand = {t: [] for t in hours}
        
        for load in flexible_loads:
            load_id = load['id']
            power = load['power_kw']
            duration = load['duration_hours']
            start_min = load['allowed_start']
            start_max = min(23, load['allowed_end'] - duration)
            if start_max < start_min:
                start_max = start_min
                
            for t in hours:
                active_tau_start = max(start_min, t - duration + 1)
                active_tau_end = min(start_max, t)
                
                if active_tau_start <= active_tau_end:
                    active_vars = [x_vars[(load_id, tau)] for tau in range(active_tau_start, active_tau_end + 1) if (load_id, tau) in x_vars and isinstance(x_vars[(load_id, tau)], pulp.LpVariable)]
                    if active_vars:
                        hourly_flexible_demand[t].append(power * pulp.lpSum(active_vars))

        # Battery Energy Conservation (SoC Transition) Constraints
        initial_soc = battery_capacity_kwh * 0.3  # Start at 30% state of charge
        for t in hours:
            prev_soc = initial_soc if t == 0 else soc[t - 1]
            prob += (
                soc[t] == prev_soc + (p_charge[t] * battery_efficiency) - (p_discharge[t] / battery_efficiency),
                f"battery_soc_balance_h{t}"
            )

        # Hourly Total Demand, Net Grid, and Peak Load Constraints
        for t in hours:
            flex_demand_t = pulp.lpSum(hourly_flexible_demand[t]) if hourly_flexible_demand[t] else 0
            total_facility_demand = base_forecast[t] + flex_demand_t
            
            # Net Grid Draw = Total Demand + Battery Charge - Solar Gen - Battery Discharge
            net_draw = total_facility_demand + p_charge[t] - solar_forecast[t] - p_discharge[t]
            
            prob += (net_grid_vars[t] >= net_draw, f"net_grid_lb_{t}")
            prob += (peak_load_var >= net_draw, f"peak_lb_{t}")

        # Multi-Objective Function
        energy_cost_term = pulp.lpSum([net_grid_vars[t] * tariff_rates[t] for t in hours])
        peak_penalty_term = peak_load_var * (demand_charge_per_kw / 30.0)
        carbon_term = pulp.lpSum([net_grid_vars[t] * carbon_factor_kg_kwh for t in hours])
        
        total_obj = (
            weight_cost * (energy_cost_term / 100.0) +
            weight_peak * (peak_penalty_term / 10.0) +
            weight_carbon * (carbon_term / 20.0)
        )
        prob += total_obj, "Weighted_Multi_Objective"

        # Solve MILP using CBC
        solver = pulp.PULP_CBC_CMD(msg=False)
        prob.solve(solver)

        # Extract Solved Schedules
        proposed_schedule = []
        proposed_load_curve = list(base_forecast)
        
        for load in flexible_loads:
            load_id = load['id']
            power = load['power_kw']
            duration = load['duration_hours']
            default_start = load.get('default_start', load['allowed_start'])
            
            opt_start = default_start
            for t in hours:
                var = x_vars.get((load_id, t))
                if isinstance(var, pulp.LpVariable) and var.varValue and var.varValue > 0.5:
                    opt_start = t
                    break
                    
            is_approved = load_id in approved_load_ids
            effective_start = opt_start if is_approved else default_start
            
            for h in range(effective_start, min(24, effective_start + duration)):
                proposed_load_curve[h] += power

            reason = self._generate_explanation(
                load_name=load['name'],
                original_start=default_start,
                proposed_start=opt_start,
                power_kw=power,
                duration_hours=duration,
                tariff_rates=tariff_rates,
                solar_forecast=solar_forecast,
                allowed_start=load['allowed_start'],
                allowed_end=load['allowed_end']
            )

            proposed_schedule.append({
                "id": load_id,
                "name": load['name'],
                "power_kw": power,
                "duration_hours": duration,
                "allowed_window": f"{load['allowed_start']:02d}:00 - {load['allowed_end']:02d}:00",
                "original_start": default_start,
                "proposed_start": opt_start,
                "effective_start": effective_start,
                "is_approved": is_approved,
                "is_critical": load.get("is_critical", False),
                "reason": reason
            })

        # Extract Battery Charge / Discharge / SoC Series
        battery_series = []
        for t in hours:
            c = round(float(p_charge[t].varValue or 0.0), 2)
            d = round(float(p_discharge[t].varValue or 0.0), 2)
            s = round(float(soc[t].varValue or 0.0), 2)
            soc_pct = round((s / battery_capacity_kwh) * 100.0, 1)
            battery_series.append({
                "hour": t,
                "charge_kw": c,
                "discharge_kw": d,
                "soc_kwh": s,
                "soc_pct": soc_pct
            })

        # Baseline Load Curve calculation
        baseline_load_curve = list(base_forecast)
        for load in flexible_loads:
            def_start = load.get('default_start', load['allowed_start'])
            for h in range(def_start, min(24, def_start + load['duration_hours'])):
                baseline_load_curve[h] += load['power_kw']

        # Apply battery impact on final net grid curves
        final_proposed_net_curve = [
            round(max(0.0, proposed_load_curve[t] + battery_series[t]["charge_kw"] - solar_forecast[t] - battery_series[t]["discharge_kw"]), 2)
            for t in hours
        ]

        baseline_peak_kw = max(baseline_load_curve)
        proposed_peak_kw = max(final_proposed_net_curve)
        
        # Calculate Costs and Carbon
        baseline_cost = sum(max(0, baseline_load_curve[t] - solar_forecast[t]) * tariff_rates[t] for t in hours)
        proposed_cost = sum(final_proposed_net_curve[t] * tariff_rates[t] for t in hours)
        
        baseline_carbon = sum(max(0, baseline_load_curve[t] - solar_forecast[t]) * carbon_factor_kg_kwh for t in hours)
        proposed_carbon = sum(final_proposed_net_curve[t] * carbon_factor_kg_kwh for t in hours)

        daily_cost_savings = max(0.0, baseline_cost - proposed_cost)
        monthly_cost_savings = daily_cost_savings * 30.0 + max(0.0, (baseline_peak_kw - proposed_peak_kw) * demand_charge_per_kw)
        daily_carbon_avoided = max(0.0, baseline_carbon - proposed_carbon)

        return {
            "proposed_schedule": proposed_schedule,
            "baseline_load_curve": [round(v, 2) for v in baseline_load_curve],
            "proposed_load_curve": [round(v, 2) for v in proposed_load_curve],
            "final_proposed_net_curve": final_proposed_net_curve,
            "battery_series": battery_series,
            "kpis": {
                "baseline_peak_kw": round(baseline_peak_kw, 2),
                "proposed_peak_kw": round(proposed_peak_kw, 2),
                "peak_reduction_kw": round(max(0.0, baseline_peak_kw - proposed_peak_kw), 2),
                "peak_reduction_pct": round(max(0.0, (baseline_peak_kw - proposed_peak_kw) / baseline_peak_kw) * 100.0, 1),
                "daily_cost_saved_inr": round(daily_cost_savings, 2),
                "monthly_cost_saved_inr": round(monthly_cost_savings, 2),
                "daily_co2_avoided_kg": round(daily_carbon_avoided, 2),
            },
            "solver_status": pulp.LpStatus[prob.status]
        }

    def _generate_explanation(
        self,
        load_name: str,
        original_start: int,
        proposed_start: int,
        power_kw: float,
        duration_hours: int,
        tariff_rates: List[float],
        solar_forecast: List[float],
        allowed_start: int,
        allowed_end: int
    ) -> str:
        if original_start == proposed_start:
            return f"Optimal schedule: Currently operating at best time window ({original_start:02d}:00)."
            
        orig_tariff = tariff_rates[original_start]
        prop_tariff = tariff_rates[proposed_start]
        
        orig_solar = solar_forecast[original_start]
        prop_solar = solar_forecast[proposed_start]
        
        reasons = []
        if prop_tariff < orig_tariff:
            reasons.append(f"avoids Peak Tariff (₹{orig_tariff:.1f}/kWh → ₹{prop_tariff:.1f}/kWh)")
        if prop_solar > 2.0 and prop_solar > orig_solar:
            reasons.append(f"harnesses Peak Solar Generation ({prop_solar:.1f} kW available)")
        if proposed_start < 17 and original_start >= 17:
            reasons.append(f"relieves Evening Grid Peak (17:00-21:00)")
            
        if not reasons:
            reasons.append(f"balances total building power demand and minimizes grid draw")
            
        reason_str = ", ".join(reasons)
        return f"Shifted from {original_start:02d}:00 to {proposed_start:02d}:00: {reason_str.capitalize()}."
