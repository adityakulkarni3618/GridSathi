"use client";

import { useState } from "react";
import { Sliders, IndianRupee, TrendingDown, Leaf } from "lucide-react";

export default function WeightSliders({ weights, onWeightsChange }) {
  const [costW, setCostW] = useState(weights?.weight_cost ?? 0.4);
  const [peakW, setPeakW] = useState(weights?.weight_peak ?? 0.4);
  const [carbonW, setCarbonW] = useState(weights?.weight_carbon ?? 0.2);

  const handleSliderChange = (type, val) => {
    const num = parseFloat(val);
    let c = costW, p = peakW, cb = carbonW;
    if (type === "cost") c = num;
    if (type === "peak") p = num;
    if (type === "carbon") cb = num;

    setCostW(c);
    setPeakW(p);
    setCarbonW(cb);

    onWeightsChange({
      weight_cost: c,
      weight_peak: p,
      weight_carbon: cb
    });
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
            MILP Optimization Weights
          </h3>
        </div>
        <span className="text-xs text-[var(--text-muted)] font-mono font-bold">
          Cost: {(costW * 100).toFixed(0)}% • Peak: {(peakW * 100).toFixed(0)}% • Carbon: {(carbonW * 100).toFixed(0)}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cost Priority Weight */}
        <div className="space-y-2 bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center space-x-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Energy Cost Priority</span>
            </span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-300">{(costW * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={costW}
            onChange={(e) => handleSliderChange("cost", e.target.value)}
            className="w-full accent-emerald-500 bg-[var(--border-color)] h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[10px] text-[var(--text-muted)] leading-tight">
            Maximizes load shifts to lowest Time-of-Day tariff slots.
          </p>
        </div>

        {/* Peak Demand Shaving Weight */}
        <div className="space-y-2 bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center space-x-1.5 font-bold text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Peak Demand Shaving</span>
            </span>
            <span className="font-mono font-black text-rose-600 dark:text-rose-300">{(peakW * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={peakW}
            onChange={(e) => handleSliderChange("peak", e.target.value)}
            className="w-full accent-rose-500 bg-[var(--border-color)] h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[10px] text-[var(--text-muted)] leading-tight">
            Flattens kW spikes to minimize monthly demand charges.
          </p>
        </div>

        {/* Carbon Reduction Weight */}
        <div className="space-y-2 bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-color)]">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center space-x-1.5 font-bold text-teal-600 dark:text-teal-400">
              <Leaf className="w-3.5 h-3.5" />
              <span>Carbon Reduction</span>
            </span>
            <span className="font-mono font-black text-teal-600 dark:text-teal-300">{(carbonW * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={carbonW}
            onChange={(e) => handleSliderChange("carbon", e.target.value)}
            className="w-full accent-teal-500 bg-[var(--border-color)] h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[10px] text-[var(--text-muted)] leading-tight">
            Prioritizes hours with high local solar PV self-consumption.
          </p>
        </div>

      </div>
    </div>
  );
}
