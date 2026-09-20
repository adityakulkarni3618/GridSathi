"use client";

import { AlertOctagon } from "lucide-react";

export default function AnomalyAlertCard({ anomalies }) {
  if (!anomalies || anomalies.length === 0) return null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 space-y-3">
      
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
        <div className="flex items-center space-x-2">
          <AlertOctagon className="w-5 h-5 text-amber-500 animate-pulse" />
          <h3 className="text-sm font-bold text-amber-600 dark:text-amber-300 uppercase tracking-wider">
            Consumption Anomaly Alerts
          </h3>
        </div>
        <span className="text-xs font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-500/30 font-bold">
          {anomalies.length} Flagged Events
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {anomalies.map((anom, idx) => (
          <div
            key={idx}
            className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-color)] space-y-2 shadow-xs"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-[var(--text-primary)]">{anom.timestamp}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                anom.severity === "High"
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
              }`}>
                {anom.severity} {anom.type}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-snug">
              {anom.description}
            </p>

            <div className="flex justify-between items-center text-[11px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
              <span>Actual: <strong className="text-amber-600 dark:text-amber-300">{anom.actual_kw} kW</strong></span>
              <span>Expected: <strong className="text-[var(--text-secondary)]">{anom.expected_kw} kW</strong></span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
