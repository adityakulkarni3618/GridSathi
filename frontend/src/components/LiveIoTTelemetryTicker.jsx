"use client";

import { useEffect, useState } from "react";
import { Activity, Radio, Cpu, CheckCircle2 } from "lucide-react";

export default function LiveIoTTelemetryTicker() {
  const [telemetry, setTelemetry] = useState({
    grid_frequency_hz: 50.02,
    line_voltage_v: 230.4,
    active_power_kw: 32.8,
    solar_power_kw: 7.2,
    battery_soc_pct: 68.4,
    relays: {
      water_pump: "ONLINE_NORMAL",
      laundry: "STANDBY_SCHEDULED",
      ev_charger: "OPTIMIZED_SLOT",
      geyser: "ONLINE_NORMAL"
    }
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to FastAPI WebSocket Stream endpoint
    const wsUrl = `ws://${window.location.hostname}:8000/ws/telemetry`;
    let ws;

    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setConnected(true);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "IOT_TELEMETRY") {
            setTelemetry(data);
          }
        } catch (e) {}
      };
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
    } catch (err) {
      setConnected(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="glass-panel p-3.5 rounded-2xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
      
      {/* Live Stream Indicator */}
      <div className="flex items-center space-x-2">
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute opacity-75"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative"></span>
        </div>
        <span className="font-bold text-[var(--text-primary)] flex items-center space-x-1">
          <Radio className="w-3.5 h-3.5 text-emerald-500" />
          <span>Live IoT Meter Telemetry</span>
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
          connected
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
        }`}>
          {connected ? "WEBSOCKET STREAM ACTIVE" : "SIMULATED SENSOR HUB"}
        </span>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="flex flex-wrap items-center gap-4 font-mono">
        
        <div>
          <span className="text-[var(--text-muted)] text-[11px]">Frequency: </span>
          <strong className="text-emerald-600 dark:text-emerald-400">{telemetry.grid_frequency_hz} Hz</strong>
        </div>

        <div>
          <span className="text-[var(--text-muted)] text-[11px]">Voltage: </span>
          <strong className="text-[var(--text-primary)]">{telemetry.line_voltage_v} V</strong>
        </div>

        <div>
          <span className="text-[var(--text-muted)] text-[11px]">Active Demand: </span>
          <strong className="text-cyan-600 dark:text-cyan-400">{telemetry.active_power_kw} kW</strong>
        </div>

        <div>
          <span className="text-[var(--text-muted)] text-[11px]">Solar Output: </span>
          <strong className="text-amber-600 dark:text-amber-400">{telemetry.solar_power_kw} kW</strong>
        </div>

      </div>

    </div>
  );
}
