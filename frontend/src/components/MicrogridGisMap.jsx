"use client";

import { useState } from "react";
import { MapPin, Zap, Sun, Battery, Server, ShieldCheck, Activity } from "lucide-react";

export default function MicrogridGisMap({ selectedBuilding }) {
  const [activeNode, setActiveNode] = useState(null);

  const nodes = [
    {
      id: "grid_substation",
      name: "33kV Commercial Grid Substation",
      type: "GRID",
      x: 20,
      y: 35,
      status: "STABLE",
      metrics: "50.02 Hz • 230V • Normal Draw",
      icon: Zap,
      color: "blue"
    },
    {
      id: "solar_pv",
      name: "Rooftop Solar PV Array (10 kW)",
      type: "SOLAR",
      x: 50,
      y: 20,
      status: "GENERATING",
      metrics: "7.2 kW Output • Pune Irradiance",
      icon: Sun,
      color: "amber"
    },
    {
      id: "bess_storage",
      name: "BESS Battery Storage (15 kWh)",
      type: "BATTERY",
      x: 78,
      y: 35,
      status: "STANDBY_CHARGED",
      metrics: "68.4% SoC • 5.0 kW Max Inverter",
      icon: Battery,
      color: "teal"
    },
    {
      id: "building_block",
      name: selectedBuilding || "Main Campus Block A",
      type: "FACILITY",
      x: 48,
      y: 70,
      status: "MILP_OPTIMIZED",
      metrics: "32.8 kW Load • 4 Rescheduled Devices",
      icon: Server,
      color: "emerald"
    }
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-500 border border-cyan-500/30">
            <MapPin className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center space-x-2">
              <span>Interactive Campus Microgrid Infrastructure Map</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                GIS MAP INTEGRATED
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Live power flow routing between 33kV Grid Substation, Solar PV, BESS Energy Storage, and Campus Facilities.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
          <span>Nodes Online: 4/4</span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full h-72 sm:h-80 bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border-color)] overflow-hidden p-4">
        
        {/* Animated Power Flow Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-current">
          {/* Substation -> Building */}
          <line x1="20%" y1="35%" x2="48%" y2="70%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 6" className="animate-pulse" />
          {/* Solar -> Building */}
          <line x1="50%" y1="20%" x2="48%" y2="70%" stroke="#f59e0b" strokeWidth="2.5" />
          {/* BESS -> Building */}
          <line x1="78%" y1="35%" x2="48%" y2="70%" stroke="#14b8a6" strokeWidth="2" strokeDasharray="4 4" />
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const Icon = node.icon;
          const isSelected = activeNode?.id === node.id;

          return (
            <div
              key={node.id}
              onClick={() => setActiveNode(node)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group ${
                isSelected ? "scale-110 z-20" : "hover:scale-105 z-10"
              }`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div className={`p-3 rounded-2xl bg-[var(--bg-surface)] border-2 flex items-center space-x-2 shadow-xl ${
                node.color === "emerald" ? "border-emerald-500 shadow-emerald-500/20" :
                node.color === "amber" ? "border-amber-500 shadow-amber-500/20" :
                node.color === "teal" ? "border-teal-500 shadow-teal-500/20" :
                "border-blue-500 shadow-blue-500/20"
              }`}>
                <div className={`p-2 rounded-xl ${
                  node.color === "emerald" ? "bg-emerald-500/20 text-emerald-500" :
                  node.color === "amber" ? "bg-amber-500/20 text-amber-500" :
                  node.color === "teal" ? "bg-teal-500/20 text-teal-500" :
                  "bg-blue-500/20 text-blue-500"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-extrabold text-[var(--text-primary)] leading-tight">{node.name}</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">{node.status}</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Floating Active Node Drawer */}
        {activeNode && (
          <div className="absolute bottom-3 left-3 right-3 bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-color)] shadow-2xl flex items-center justify-between text-xs animate-in slide-in-from-bottom">
            <div>
              <span className="font-bold text-[var(--text-primary)]">{activeNode.name}: </span>
              <span className="font-mono text-emerald-500">{activeNode.metrics}</span>
            </div>
            <button
              onClick={() => setActiveNode(null)}
              className="px-2.5 py-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--border-color)] text-[var(--text-muted)] font-semibold rounded-lg"
            >
              Dismiss
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
