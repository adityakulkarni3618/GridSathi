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
        approved_load_ids: List[str] = None # Loads approved by user
    ) -> Dict[str, Any]:
        """
        Formulate and solve MILP optimization problem using PuLP.
        Determines optimal start times for flexible loads to minimize cost, peak demand, and carbon emissions.
        """
        if approved_load_ids is None:
            approved_load_ids = [load['id'] for load in flexible_loads]
            
        prob = pulp.LpProblem("GridSathi_Smart_Demand_Scheduling", pulp.LpMinimize)
        
        hours = list(range(24))
        
        # Binary Decision Variables: x[i, t] = 1 if flexible load i starts at hour t
        x_vars = {}
        for load in flexible_loads:
            load_id = load['id']
            start_min = load['allowed_start']
            start_max = min(23, load['allowed_end'] - load['duration_hours'])
            
            # Start max must be >= start_min
            if start_max < start_min:
                start_max = start_min
                
            for t in hours:
                if start_min <= t <= start_max:
                    x_vars[(load_id, t)] = pulp.LpVariable(f"start_{load_id}_h{t}", cat=pulp.LpBinary)
                else:
                    x_vars[(load_id, t)] = 0  # Forbidden outside allowed window

        # Peak Load Variable
        peak_load_var = pulp.LpVariable("Peak_Load_kW", lowBound=0, cat=pulp.LpContinuous)
        
        # Net Grid Demand Variables for each hour
        net_grid_vars = {t: pulp.LpVariable(f"net_grid_h{t}", lowBound=0, cat=pulp.LpContinuous) for t in hours}
        
        # 1. Start Once Constraint for each load
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
            
        # 2. Hourly Total Demand and Net Grid Constraints
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
                # Active at hour t if started at tau where t - duration + 1 <= tau <= t
                active_tau_start = max(start_min, t - duration + 1)
                active_tau_end = min(start_max, t)
                
                if active_tau_start <= active_tau_end:
                    active_vars = [x_vars[(load_id, tau)] for tau in range(active_tau_start, active_tau_end + 1) if (load_id, tau) in x_vars and isinstance(x_vars[(load_id, tau)], pulp.LpVariable)]
                    if active_vars:
                        hourly_flexible_demand[t].append(power * pulp.lpSum(active_vars))

        for t in hours:
            # Baseline without flexible loads (assuming base_forecast has default unoptimized flexible loads removed or base building load)
            # Base load = base_forecast[t]
            flex_demand_t = pulp.lpSum(hourly_flexible_demand[t]) if hourly_flexible_demand[t] else 0
            total_demand_t = base_forecast[t] + flex_demand_t
            
            # Net Grid Demand = max(0, total_demand_t - solar_forecast[t])
            prob += (net_grid_vars[t] >= total_demand_t - solar_forecast[t], f"net_grid_lb_{t}")
            
            # Peak Demand Constraint
            prob += (peak_load_var >= total_demand_t, f"peak_lb_{t}")

        # 3. Objective Function Formulation
        # Cost term
        energy_cost_term = pulp.lpSum([net_grid_vars[t] * tariff_rates[t] for t in hours])
        # Daily prorated peak demand penalty (Monthly rate / 30)
        peak_penalty_term = peak_load_var * (demand_charge_per_kw / 30.0)
        # Carbon emissions term
        carbon_term = pulp.lpSum([net_grid_vars[t] * carbon_factor_kg_kwh for t in hours])
        
        # Scale terms for balanced multi-objective optimization
        total_obj = (
            weight_cost * (energy_cost_term / 100.0) +
            weight_peak * (peak_penalty_term / 10.0) +
            weight_carbon * (carbon_term / 20.0)
        )
        prob += total_obj, "Weighted_Multi_Objective"

        # Solve MILP
        solver = pulp.PULP_CBC_CMD(msg=False)
        solver_status = prob.solve(solver)

        # Process Results
        proposed_schedule = []
        proposed_load_curve = list(base_forecast)
        
        for load in flexible_loads:
            load_id = load['id']
            power = load['power_kw']
            duration = load['duration_hours']
            default_start = load.get('default_start', load['allowed_start'])
            
            opt_start = default_start
            # Extract solved start time
            for t in hours:
                var = x_vars.get((load_id, t))
                if isinstance(var, pulp.LpVariable) and var.varValue and var.varValue > 0.5:
                    opt_start = t
                    break
                    
            # Determine if approved by user
            is_approved = load_id in approved_load_ids
            effective_start = opt_start if is_approved else default_start
            
            # Add to proposed load curve if approved
            for h in range(effective_start, min(24, effective_start + duration)):
                proposed_load_curve[h] += power

            # Generate plain-language rationale
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

        # Calculate metrics for baseline vs proposed
        baseline_load_curve = list(base_forecast)
        for load in flexible_loads:
            def_start = load.get('default_start', load['allowed_start'])
            for h in range(def_start, min(24, def_start + load['duration_hours'])):
                baseline_load_curve[h] += load['power_kw']

        baseline_peak_kw = max(baseline_load_curve)
        proposed_peak_kw = max(proposed_load_curve)
        
        # Calculate Costs and Carbon
        baseline_cost = sum(max(0, baseline_load_curve[t] - solar_forecast[t]) * tariff_rates[t] for t in hours)
        proposed_cost = sum(max(0, proposed_load_curve[t] - solar_forecast[t]) * tariff_rates[t] for t in hours)
        
        baseline_carbon = sum(max(0, baseline_load_curve[t] - solar_forecast[t]) * carbon_factor_kg_kwh for t in hours)
        proposed_carbon = sum(max(0, proposed_load_curve[t] - solar_forecast[t]) * carbon_factor_kg_kwh for t in hours)

        daily_cost_savings = max(0.0, baseline_cost - proposed_cost)
        monthly_cost_savings = daily_cost_savings * 30.0 + max(0.0, (baseline_peak_kw - proposed_peak_kw) * demand_charge_per_kw)
        daily_carbon_avoided = max(0.0, baseline_carbon - proposed_carbon)

        return {
            "proposed_schedule": proposed_schedule,
            "baseline_load_curve": [round(v, 2) for v in baseline_load_curve],
            "proposed_load_curve": [round(v, 2) for v in proposed_load_curve],
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
        """Generate plain-language explanation for why a load shift was recommended."""
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
