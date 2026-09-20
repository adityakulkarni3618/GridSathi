"use client";

import { useEffect, useState } from "react";
import { X, History, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { fetchAuditLogs } from "../lib/api";

export default function AuditLogModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAuditLogs()
        .then((res) => setLogs(res.audit_logs || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-3xl glass-panel p-6 rounded-2xl border border-[var(--border-color)] space-y-5 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Human-in-the-loop Audit Log
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-surface-elevated)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Immutable audit record stored in local SQLite database tracking every operator approval or rejection.
        </p>

        {/* Audit Log Table */}
        <div className="overflow-y-auto flex-1 pr-1">
          {loading ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-xs">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-xs">No audit decisions recorded yet.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-[var(--text-muted)] border-b border-[var(--border-color)] uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Device</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Schedule Change</th>
                  <th className="py-2.5 px-3">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {logs.map((log) => {
                  const isApproved = log.action === "APPROVED";
                  return (
                    <tr key={log.id} className="hover:bg-[var(--bg-surface-elevated)] transition-colors">
                      <td className="py-3 px-3 font-mono text-[var(--text-muted)] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                        {log.device_name}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isApproved
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                        }`}>
                          {isApproved ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{log.action}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[var(--text-secondary)] whitespace-nowrap">
                        {String(log.original_start).padStart(2, '0')}:00 → {String(log.proposed_start).padStart(2, '0')}:00
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)] max-w-xs truncate">
                        {log.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-color)] pt-3 flex justify-between items-center text-xs text-[var(--text-muted)]">
          <span className="flex items-center space-x-1 text-emerald-500">
            <ShieldCheck className="w-4 h-4" />
            <span>SQLite Database Audit Trail Active</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
