"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, ShieldCheck, History, Sliders, Play, AlertTriangle, Sun, Moon, Building2, Download, Calculator } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

export default function Navbar({
  onLoadDemo,
  onOpenAuditLog,
  onOpenConfig,
  onOpenScenario,
  onOpenRoi,
  isDemoLoading,
  activeScenario,
  selectedBuilding,
  onBuildingSelect
}) {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo & Multi-Campus Selector */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-all">
                <Zap className="w-5 h-5 text-gray-950 fill-gray-950" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-black tracking-tight text-[var(--text-primary)]">
                  GridSathi
                </span>
                <span className="block text-[9px] text-[var(--text-muted)] tracking-wider font-mono uppercase">
                  AI Energy & BESS Scheduler
                </span>
              </div>
            </Link>

            {/* Facility Dropdown */}
            <div className="flex items-center space-x-1.5 pl-2 sm:pl-3 border-l border-[var(--border-color)]">
              <Building2 className="w-4 h-4 text-emerald-500 hidden xl:block" />
              <select
                value={selectedBuilding}
                onChange={(e) => onBuildingSelect && onBuildingSelect(e.target.value)}
                className="bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-emerald-500 max-w-[150px] sm:max-w-[200px] truncate"
              >
                <option value="Main Campus Block A">Main Campus Block A (120 kW)</option>
                <option value="Hostel Complex B">Hostel Complex B (45 kW)</option>
                <option value="Solar Microgrid Station C">Solar Microgrid Station C (30 kW)</option>
              </select>
            </div>

            {/* Navigation Links */}
            <nav className="hidden xl:flex ml-2 space-x-1">
              <Link
                href="/"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/responsible-ai"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                  pathname === "/responsible-ai"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Responsible AI</span>
              </Link>
            </nav>
          </div>

          {/* Action Tools Bar */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* ROI Payback Calculator Button */}
            <button
              onClick={onOpenRoi}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all flex items-center space-x-1"
              title="Open ROI Payback Calculator"
            >
              <Calculator className="w-4 h-4 text-emerald-500" />
              <span className="hidden md:inline">ROI</span>
            </button>

            {/* Download PDF Report */}
            <button
              onClick={handleDownloadPDF}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all flex items-center space-x-1"
              title="Print / Export PDF Report"
            >
              <Download className="w-4 h-4 text-teal-500" />
              <span className="hidden lg:inline">PDF</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] border border-[var(--border-color)] transition-all"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle Theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Scenario Simulator Trigger */}
            <button
              onClick={onOpenScenario}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1 ${
                activeScenario && activeScenario !== "NORMAL"
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300 animate-pulse shadow-xs"
                  : "bg-[var(--bg-surface-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Scenario Stress Simulator"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="hidden md:inline">{activeScenario && activeScenario !== "NORMAL" ? activeScenario : "Scenario"}</span>
            </button>

            {/* Config Modal Button */}
            <button
              onClick={onOpenConfig}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-xl transition-all"
              title="View & Edit Tariff Assumptions"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Audit Log Button */}
            <button
              onClick={onOpenAuditLog}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all flex items-center space-x-1"
              title="Human-in-the-loop Audit Log"
            >
              <History className="w-4 h-4 text-emerald-500" />
              <span className="hidden md:inline">Audit</span>
            </button>

            {/* One-Click Demo Mode Button */}
            <button
              onClick={onLoadDemo}
              disabled={isDemoLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-gray-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex-shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-gray-950" />
              <span>{isDemoLoading ? "Loading..." : "Load Demo Scenario"}</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
