"use client";

import { TrendingDown, IndianRupee, Leaf, BrainCircuit, CheckCircle2 } from "lucide-react";

export default function KpiCards({ kpis, forecastMetrics, dataFreshness }) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Peak Demand Reduction Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Peak Demand</span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {kpis.proposed_peak_kw} <span className="text-xs font-semibold text-[var(--text-muted)]">kW</span>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              Baseline: <span className="line-through opacity-75">{kpis.baseline_peak_kw} kW</span>
            </div>
          </div>
          {kpis.peak_reduction_pct > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              -{kpis.peak_reduction_pct}%
            </span>
          )}
        </div>
      </div>

      {/* 2. Energy Cost Savings Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Estimated Savings</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            ₹{kpis.daily_cost_saved_inr.toLocaleString("en-IN")} <span className="text-xs font-normal text-[var(--text-muted)]">/ day</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center justify-between">
            <span>Projected Monthly:</span>
            <span className="font-bold text-[var(--text-secondary)]">₹{kpis.monthly_cost_saved_inr.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* 3. Carbon Avoided Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Carbon Avoided</span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20">
            <Leaf className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-black text-teal-600 dark:text-teal-300 tracking-tight">
            {kpis.daily_co2_avoided_kg} <span className="text-xs font-normal text-[var(--text-muted)]">kg CO₂</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            Based on ~0.72 kg CO₂/kWh factor
          </div>
        </div>
      </div>

      {/* 4. Forecast Accuracy Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Forecast Model</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            <BrainCircuit className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              {forecastMetrics?.lightgbm?.mape ?? 3.8}% <span className="text-xs font-normal text-[var(--text-muted)]">MAPE</span>
            </div>
            {forecastMetrics?.improvement_pct > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                +{forecastMetrics.improvement_pct}% vs Naive
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center space-x-1 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{dataFreshness || "LightGBM + Quantile bands"}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
