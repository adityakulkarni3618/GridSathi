"use client";

import { Check, X, ShieldAlert, ArrowRight, Clock, Zap, Info } from "lucide-react";

export default function ScheduleTable({ schedule, criticalLoads, onAction, isLoadingAction }) {
  if (!schedule || schedule.length === 0) return null;

  return (
    <div className="space-y-6">
      
      {/* 1. Flexible Loads Recommendation Table */}
      <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center space-x-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              <span>Smart Load Rescheduling Suggestions</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Human-in-the-loop governance: Approve or Reject proposed load shifts. Only approved changes update baseline metrics.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
            4 Flexible Loads Analyzed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-[var(--text-muted)] border-b border-[var(--border-color)] uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-3">Device & Rating</th>
                <th className="py-3 px-3">Allowed Window</th>
                <th className="py-3 px-3">Shifted Schedule</th>
                <th className="py-3 px-3">Optimization Rationale</th>
                <th className="py-3 px-3 text-right">Human Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {schedule.map((item) => {
                const isApproved = item.is_approved;
                const isMoved = item.original_start !== item.proposed_start;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isApproved 
                        ? "bg-emerald-500/10 dark:bg-emerald-950/20" 
                        : "hover:bg-[var(--bg-surface-elevated)]"
                    }`}
                  >
                    {/* Device Name & Rating */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[var(--text-primary)] text-sm">{item.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center space-x-2 mt-0.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{item.power_kw} kW</span>
                        <span>•</span>
                        <span>{item.duration_hours} hrs run</span>
                      </div>
                    </td>

                    {/* Allowed Window */}
                    <td className="py-3.5 px-3 font-mono text-[var(--text-secondary)]">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>{item.allowed_window}</span>
                      </div>
                    </td>

                    {/* Shifted Schedule */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="line-through text-[var(--text-muted)] font-medium">
                          {String(item.original_start).padStart(2, '0')}:00
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                        <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                          isMoved
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
                        }`}>
                          {String(item.proposed_start).padStart(2, '0')}:00
                        </span>
                      </div>
                    </td>

                    {/* Plain Language Rationale */}
                    <td className="py-3.5 px-3 text-[var(--text-secondary)] max-w-md">
                      <div className="flex items-start space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item.reason}</span>
                      </div>
                    </td>

                    {/* Human Approve/Reject Controls */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        
                        {/* Approve Button */}
                        <button
                          onClick={() => onAction(item.id, "APPROVE")}
                          disabled={isLoadingAction}
                          className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1 text-xs transition-all ${
                            isApproved
                              ? "bg-emerald-500 text-gray-950 font-bold shadow-md shadow-emerald-500/20"
                              : "bg-[var(--bg-surface-elevated)] hover:bg-emerald-500/20 text-[var(--text-secondary)] hover:text-emerald-600 dark:hover:text-emerald-300 border border-[var(--border-color)]"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isApproved ? "Approved" : "Approve"}</span>
                        </button>

                        {/* Reject Button */}
                        <button
                          onClick={() => onAction(item.id, "REJECT")}
                          disabled={isLoadingAction}
                          className={`px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 text-xs transition-all ${
                            !isApproved
                              ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40"
                              : "bg-[var(--bg-surface-elevated)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-300 border border-[var(--border-color)]"
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* 2. Immutable Critical Loads Section */}
      <div className="glass-card p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Locked Critical Loads (Immutable)</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] px-2 py-0.5 rounded border border-[var(--border-color)]">
            NEVER RESCHEDULED BY MILP
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {criticalLoads?.map((load) => (
            <div
              key={load.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-color)]"
            >
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)]">{load.name}</div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Continuous 24h Base Demand</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-rose-500 font-mono">{load.power_kw} kW</span>
                <div className="text-[9px] text-emerald-500 font-semibold uppercase">Locked</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
