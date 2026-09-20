"use client";

import { useState, useEffect } from "react";
import { Battery, Zap, ArrowUpRight, ArrowDownRight, RefreshCw, ShieldCheck } from "lucide-react";

export default function BatteryStorageCard({ batterySeries }) {
  const [currentHour, setCurrentHour] = useState(14); // Default 14:00 peak solar

  if (!batterySeries || batterySeries.length === 0) return null;

  const currentData = batterySeries[currentHour] || batterySeries[0];
  const isCharging = currentData.charge_kw > 0;
  const isDischarging = currentData.discharge_kw > 0;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-teal-500/15 text-teal-500 border border-teal-500/30">
            <Battery className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center space-x-2">
              <span>BESS Storage & Discharge Schedule (15 kWh Pack)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                STRETCH GOAL ACTIVE
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              MILP co-optimized battery storage: charges during solar surplus/off-peak and discharges during ₹11/kWh evening peak.
            </p>
          </div>
        </div>

        {/* Hour Selector Slider */}
        <div className="flex items-center space-x-2 bg-[var(--bg-surface-elevated)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] self-start sm:self-auto">
          <span className="text-xs text-[var(--text-muted)] font-mono font-bold">Inspect Hour:</span>
          <select
            value={currentHour}
            onChange={(e) => setCurrentHour(parseInt(e.target.value))}
            className="bg-[var(--bg-main)] text-xs font-mono font-bold text-[var(--text-primary)] px-2 py-1 rounded border border-[var(--border-color)] outline-none"
          >
            {batterySeries.map((item) => (
              <option key={item.hour} value={item.hour}>
                {String(item.hour).padStart(2, '0')}:00 {item.hour >= 17 && item.hour <= 21 ? "(PEAK)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* State of Charge (SoC %) */}
        <div className="bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>State of Charge (SoC)</span>
            <span className="font-mono text-teal-500">{currentData.soc_pct}%</span>
          </div>
          <div className="w-full bg-[var(--border-color)] h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentData.soc_pct > 70 ? "bg-teal-500" : currentData.soc_pct > 30 ? "bg-cyan-500" : "bg-amber-500"
              }`}
              style={{ width: `${currentData.soc_pct}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] font-mono flex justify-between">
            <span>Energy Stored:</span>
            <strong className="text-[var(--text-primary)]">{currentData.soc_kwh} / 15.0 kWh</strong>
          </div>
        </div>

        {/* Charge Rate (kW) */}
        <div className="bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-color)] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span className="flex items-center space-x-1 text-emerald-500">
              <ArrowDownRight className="w-4 h-4" />
              <span>Charge Rate (Grid/Solar → BESS)</span>
            </span>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {currentData.charge_kw} <span className="text-xs font-normal text-[var(--text-muted)]">kW</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {isCharging ? "Charging from Solar / Off-Peak" : "Idle"}
          </div>
        </div>

        {/* Discharge Rate (kW) */}
        <div className="bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-color)] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span className="flex items-center space-x-1 text-amber-500">
              <ArrowUpRight className="w-4 h-4" />
              <span>Discharge Rate (BESS → Building)</span>
            </span>
          </div>
          <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
            {currentData.discharge_kw} <span className="text-xs font-normal text-[var(--text-muted)]">kW</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {isDischarging ? "Discharging to offset ₹11/kWh Peak" : "Idle / Standby"}
          </div>
        </div>

      </div>

    </div>
  );
}
