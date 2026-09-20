"use client";

import Navbar from "../../components/Navbar";
import { ShieldCheck, Database, BrainCircuit, Users, AlertTriangle, Cpu, Sparkles } from "lucide-react";

export default function ResponsibleAIPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans pb-16 transition-colors duration-300">
      
      {/* Sticky Top Navbar */}
      <Navbar
        onLoadDemo={() => {}}
        onOpenAuditLog={() => {}}
        onOpenConfig={() => {}}
        onOpenScenario={() => {}}
        isDemoLoading={false}
        activeScenario="NORMAL"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Transparency Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[var(--bg-surface)] to-teal-500/10 space-y-3 shadow-md">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>RESPONSIBLE AI TRANSPARENCY DISCLOSURE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Governance, Ethics & Algorithm Disclosures
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            GridSathi (PS-19: AI Energy Forecasting & Smart Demand Scheduling) is engineered with transparency, safety, human control, and environmental ethics at its core, advancing UN Sustainable Development Goals 7 (Affordable & Clean Energy), 9 (Industry & Innovation), and 13 (Climate Action).
          </p>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* 1. Human Control Governance */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-emerald-500 font-bold text-base">
              <Users className="w-5 h-5" />
              <span>Human-In-The-Loop Statement</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              GridSathi is designed strictly as a <strong>decision-support system</strong>, NOT an autonomous remote actuator.
            </p>
            <ul className="text-xs text-[var(--text-muted)] space-y-2 list-disc list-inside">
              <li>No load is automatically switched without explicit operator authorization.</li>
              <li>Facility managers retain absolute approval/rejection rights per recommendation.</li>
              <li>Every human action is logged with timestamp in a local SQLite audit database.</li>
              <li><strong>Critical loads</strong> (Servers, Emergency Lighting) are locked and immutable.</li>
            </ul>
          </div>

          {/* 2. Models Architecture */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-cyan-500 font-bold text-base">
              <BrainCircuit className="w-5 h-5" />
              <span>Model Architecture & Disclosures</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Full technical disclosure of algorithms and optimization solvers:
            </p>
            <ul className="text-xs text-[var(--text-muted)] space-y-2">
              <li className="flex items-start space-x-2">
                <Cpu className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span><strong>Demand Forecast:</strong> LightGBM Gradient Boosting Regressor trained on lag, calendar, and telemetry features.</span>
              </li>
              <li className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span><strong>Uncertainty Bands:</strong> Quantile LightGBM models ($\alpha = 0.10, 0.90$) for prediction interval bounds.</span>
              </li>
              <li className="flex items-start space-x-2">
                <BrainCircuit className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span><strong>Smart Scheduler:</strong> Mixed Integer Linear Programming (PuLP MILP CBC solver) balancing cost, peak, and carbon.</span>
              </li>
              <li className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>AI Assistance:</strong> Prototype code constructed with Google DeepMind pair programming assistance.</span>
              </li>
            </ul>
          </div>

          {/* 3. Data Sources & Fallback */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-amber-500 font-bold text-base">
              <Database className="w-5 h-5" />
              <span>Data Sources & Telemetry</span>
            </div>
            <ul className="text-xs text-[var(--text-muted)] space-y-2.5">
              <li>
                <strong className="text-[var(--text-primary)]">Load Consumption:</strong> UCI Individual Household Electric Power / Kaggle Hourly Energy Dataset.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Solar Irradiance:</strong> NASA POWER Hourly Satellite Solar Radiation API for Pune location ($18.52^\circ N, 73.85^\circ E$).
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Offline Uptime:</strong> Automatic realistic fallback generation if live API endpoint is unreachable.
              </li>
            </ul>
          </div>

          {/* 4. Assumptions & Financial Model */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-teal-500 font-bold text-base">
              <ShieldCheck className="w-5 h-5" />
              <span>Assumptions & Tariff Parameters</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              All financial and carbon impact metrics are computed using explicit assumptions:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="bg-[var(--bg-surface-elevated)] p-2 rounded-xl border border-[var(--border-color)]">
                <div className="text-[var(--text-muted)] text-[10px]">Off-Peak Tariff</div>
                <div className="text-emerald-500 font-bold">₹4.5 / kWh</div>
              </div>
              <div className="bg-[var(--bg-surface-elevated)] p-2 rounded-xl border border-[var(--border-color)]">
                <div className="text-[var(--text-muted)] text-[10px]">Peak Tariff (17-21)</div>
                <div className="text-rose-500 font-bold">₹11.0 / kWh</div>
              </div>
              <div className="bg-[var(--bg-surface-elevated)] p-2 rounded-xl border border-[var(--border-color)]">
                <div className="text-[var(--text-muted)] text-[10px]">Grid CO₂ Factor</div>
                <div className="text-teal-500 font-bold">0.72 kg / kWh</div>
              </div>
              <div className="bg-[var(--bg-surface-elevated)] p-2 rounded-xl border border-[var(--border-color)]">
                <div className="text-[var(--text-muted)] text-[10px]">Demand Charge</div>
                <div className="text-[var(--text-primary)] font-bold">₹250 / kW / mo</div>
              </div>
            </div>
          </div>

        </div>

        {/* Limitations Alert */}
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2">
          <div className="flex items-center space-x-2 text-amber-500 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Limitations & Boundary Conditions</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Forecast precision relies on historical baseline consistency. Unannounced facility expansion, weather fronts, or hardware outages can produce deviations. Operators should verify device readiness before executing schedule shifts.
          </p>
        </div>

      </main>
    </div>
  );
}
