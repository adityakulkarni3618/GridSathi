"use client";

import { useState } from "react";
import { X, Sliders, Check, IndianRupee, Sun, Leaf } from "lucide-react";
import { updateAppConfig } from "../lib/api";

export default function ConfigModal({ isOpen, onClose, configData, onConfigUpdated }) {
  const [solarKw, setSolarKw] = useState(configData?.solar_capacity_kw ?? 10.0);
  const [demandCharge, setDemandCharge] = useState(configData?.demand_charge_per_kw ?? 250.0);
  const [carbonFactor, setCarbonFactor] = useState(configData?.carbon_factor_kg_kwh ?? 0.72);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      await updateAppConfig({
        solar_capacity_kw: parseFloat(solarKw),
        demand_charge_per_kw: parseFloat(demandCharge),
        carbon_factor_kg_kwh: parseFloat(carbonFactor)
      });
      if (onConfigUpdated) onConfigUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-[var(--border-color)] space-y-5">
        
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Grid & Financial Assumptions
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-elevated)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Configure Time-of-Day electricity tariffs, grid emission factors, and solar PV array sizing.
        </p>

        <div className="space-y-4 text-xs">
          
          {/* Solar PV Capacity */}
          <div className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-1.5">
            <label className="font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Solar PV System Capacity (kW)</span>
            </label>
            <input
              type="number"
              value={solarKw}
              onChange={(e) => setSolarKw(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono focus:border-emerald-500 outline-none"
            />
            <p className="text-[10px] text-[var(--text-muted)]">Determines local solar generation output profile for Pune location.</p>
          </div>

          {/* Demand Charge */}
          <div className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-1.5">
            <label className="font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
              <IndianRupee className="w-4 h-4 text-rose-500" />
              <span>Peak Demand Charge Rate (₹ / kW peak / month)</span>
            </label>
            <input
              type="number"
              value={demandCharge}
              onChange={(e) => setDemandCharge(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono focus:border-emerald-500 outline-none"
            />
            <p className="text-[10px] text-[var(--text-muted)]">Commercial DISCOM penalty for peak billing demand.</p>
          </div>

          {/* Carbon Factor */}
          <div className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-1.5">
            <label className="font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
              <Leaf className="w-4 h-4 text-teal-500" />
              <span>Grid Emission Intensity Factor (kg CO₂ / kWh)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={carbonFactor}
              onChange={(e) => setCarbonFactor(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono focus:border-emerald-500 outline-none"
            />
            <p className="text-[10px] text-[var(--text-muted)]">Indian regional grid average baseline carbon factor (~0.72 kg/kWh).</p>
          </div>

          {/* TOD Tariff Display */}
          <div className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-2">
            <div className="font-bold text-[var(--text-primary)]">Configured Time-Of-Day (TOD) Tariffs</div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-300">
                <div className="font-semibold">Off-Peak (22-06)</div>
                <div className="font-bold text-sm mt-0.5">₹4.5 / kWh</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 p-2 rounded-lg text-blue-600 dark:text-blue-300">
                <div className="font-semibold">Normal (06-17)</div>
                <div className="font-bold text-sm mt-0.5">₹7.0 / kWh</div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/30 p-2 rounded-lg text-rose-600 dark:text-rose-300">
                <div className="font-semibold">Peak (17-21)</div>
                <div className="font-bold text-sm mt-0.5">₹11.0 / kWh</div>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-[var(--border-color)] pt-3 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-semibold">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20">
            <Check className="w-4 h-4" />
            <span>Apply Assumptions</span>
          </button>
        </div>

      </div>
    </div>
  );
}
