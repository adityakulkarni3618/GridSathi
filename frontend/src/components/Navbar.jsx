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
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Multi-Campus Selector */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
                <Zap className="w-5 h-5 text-gray-950 fill-gray-950" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-[var(--text-primary)]">
                  GridSathi
                </span>
                <span className="block text-[10px] text-[var(--text-muted)] tracking-wider font-mono uppercase">
                  AI Energy & BESS Scheduler
                </span>
              </div>
            </Link>

            {/* Campus / Facility Dropdown */}
            <div className="hidden lg:flex items-center space-x-1.5 ml-4 pl-4 border-l border-[var(--border-color)]">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <select
                value={selectedBuilding}
                onChange={(e) => onBuildingSelect && onBuildingSelect(e.target.value)}
                className="bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:border-emerald-500"
              >
                <option value="Main Campus Block A">Main Campus Block A (120 kW)</option>
                <option value="Hostel Complex B">Hostel Complex B (45 kW)</option>
                <option value="Solar Microgrid Station C">Solar Microgrid Station C (30 kW)</option>
              </select>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex ml-4 space-x-1.5">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === "/"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/responsible-ai"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  pathname === "/responsible-ai"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Responsible AI</span>
              </Link>
            </nav>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* ROI Payback Calculator Button */}
            <button
              onClick={onOpenRoi}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all"
              title="Open ROI & CapEx Payback Calculator"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">ROI Calculator</span>
            </button>

            {/* Download PDF Report */}
            <button
              onClick={handleDownloadPDF}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all"
              title="Print / Export Executive PDF Audit Report"
            >
              <Download className="w-3.5 h-3.5 text-teal-500" />
              <span>Export PDF</span>
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
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                activeScenario && activeScenario !== "NORMAL"
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300 animate-pulse shadow-sm"
                  : "bg-[var(--bg-surface-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>{activeScenario && activeScenario !== "NORMAL" ? activeScenario : "Scenario Sim"}</span>
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all"
            >
              <History className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Audit Log</span>
            </button>

            {/* One-Click Demo Mode Button */}
            <button
              onClick={onLoadDemo}
              disabled={isDemoLoading}
              className="flex items-center space-x-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
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
