"use client";

import { useState } from "react";
import { Calculator, X, IndianRupee, Leaf, ShieldCheck, Check } from "lucide-react";

export default function RoiPaybackModal({ isOpen, onClose, kpis }) {
  const [bessCapEx, setBessCapEx] = useState(180000); // INR 1.8 Lakhs for 15 kWh battery
  const [installationCost, setInstallationCost] = useState(30000);

  if (!isOpen) return null;

  const dailySavings = kpis?.daily_cost_saved_inr ?? 450;
  const annualEnergySavings = dailySavings * 365;
  const annualPeakDemandSavings = (kpis?.peak_reduction_kw ?? 13.4) * 250 * 12;
  const totalAnnualSavings = annualEnergySavings + annualPeakDemandSavings;

  const totalInvestment = parseFloat(bessCapEx) + parseFloat(installationCost);
  const paybackYears = (totalInvestment / (totalAnnualSavings || 1)).toFixed(1);
  const tenYearNetSavings = (totalAnnualSavings * 10 - totalInvestment).toFixed(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-[var(--border-color)] space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Financial ROI & CapEx Payback Calculator
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-elevated)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Calculate facility capital expenditure (CapEx) payback timeline for BESS storage and Smart Scheduler deployment.
        </p>

        {/* Form Inputs */}
        <div className="space-y-3 text-xs">
          
          <div className="bg-[var(--bg-surface-elevated)] p-3 rounded-xl border border-[var(--border-color)] space-y-1">
            <label className="font-bold text-[var(--text-primary)]">BESS Battery & Hardware CapEx (₹)</label>
            <input
              type="number"
              value={bessCapEx}
              onChange={(e) => setBessCapEx(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] font-mono outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-[var(--bg-surface-elevated)] p-3 rounded-xl border border-[var(--border-color)] space-y-1">
            <label className="font-bold text-[var(--text-primary)]">Smart Meter & Installation Cost (₹)</label>
            <input
              type="number"
              value={installationCost}
              onChange={(e) => setInstallationCost(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] font-mono outline-none focus:border-emerald-500"
            />
          </div>

        </div>

        {/* Calculated Results Box */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--text-secondary)] font-medium">Estimated Annual Financial Savings:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{totalAnnualSavings.toLocaleString("en-IN")} / yr</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--text-secondary)] font-medium">CapEx Payback Timeline:</span>
            <span className="font-mono font-black text-emerald-500 text-sm">{paybackYears} Years</span>
          </div>

          <div className="flex justify-between items-center text-xs border-t border-emerald-500/20 pt-2">
            <span className="text-[var(--text-secondary)] font-medium">10-Year Projected Net Savings:</span>
            <span className="font-mono font-extrabold text-teal-600 dark:text-teal-300">₹{parseInt(tenYearNetSavings).toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] pt-3 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs">
            Close Calculator
          </button>
        </div>

      </div>
    </div>
  );
}
