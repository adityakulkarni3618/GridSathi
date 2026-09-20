"use client";

import { X, CloudRain, Zap, Sun, ShieldCheck } from "lucide-react";

export default function ScenarioDrawer({ isOpen, onClose, onSelectScenario, activeScenario, safetyMarginKw }) {
  if (!isOpen) return null;

  const scenarios = [
    {
      id: "NORMAL",
      name: "Normal Baseline",
      icon: Sun,
      color: "emerald",
      desc: "Standard daily load profile and clear-sky solar generation."
    },
    {
      id: "SURGE_20",
      name: "+20% Demand Surge",
      icon: Zap,
      color: "amber",
      desc: "Simulates sudden spike in building consumption across campus."
    },
    {
      id: "SOLAR_DROP_50",
      name: "Cloudy Sky (-50% Solar)",
      icon: CloudRain,
      color: "blue",
      desc: "Heavy cloud cover dropping PV solar generation by 50%."
    },
    {
      id: "HEATWAVE",
      name: "Extreme Heatwave (+30% HVAC)",
      icon: Zap,
      color: "rose",
      desc: "High outdoor temperatures driving maximum HVAC cooling load."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md h-full glass-panel p-6 border-l border-[var(--border-color)] space-y-6 overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center space-x-2">
              <span>Scenario Simulator</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Stress-test the ML forecast and MILP scheduler under extreme grid conditions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-elevated)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Safety Margin Indicator */}
        <div className="bg-[var(--bg-surface-elevated)] p-4 rounded-xl border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)] font-medium">Grid Safety Headroom:</span>
            <span className="font-mono font-bold text-emerald-500 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{safetyMarginKw} kW</span>
            </span>
          </div>
          <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (safetyMarginKw / 12.0) * 100)}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Current remaining transformer & breaker capacity safety margin.
          </p>
        </div>

        {/* Scenario Selectors */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Select Simulation Scenario
          </h3>

          {scenarios.map((scen) => {
            const Icon = scen.icon;
            const isSelected = activeScenario === scen.name || (activeScenario === "NORMAL" && scen.id === "NORMAL");

            return (
              <button
                key={scen.id}
                onClick={() => {
                  onSelectScenario(scen.id);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3.5 ${
                  isSelected
                    ? "bg-emerald-500/10 border-emerald-500/40 text-[var(--text-primary)] shadow-lg shadow-emerald-500/10"
                    : "bg-[var(--bg-surface-elevated)] border-[var(--border-color)] hover:border-emerald-500/30 text-[var(--text-secondary)] hover:bg-[var(--border-color)]"
                }`}
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)] flex items-center justify-between">
                    <span>{scen.name}</span>
                    {isSelected && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    {scen.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
