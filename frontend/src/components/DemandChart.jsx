"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
} from "recharts";
import { useTheme } from "../lib/ThemeContext";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const tariffRate = data.tariff_rate;
    const isPeak = tariffRate >= 11.0;
    const isOffPeak = tariffRate <= 5.0;

    return (
      <div className="glass-panel p-3.5 rounded-xl border border-[var(--border-color)] text-xs shadow-xl min-w-[210px]">
        <div className="font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-1.5 mb-2 flex items-center justify-between">
          <span>Time: {label}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            isPeak ? "bg-rose-500/20 text-rose-500 border border-rose-500/30" :
            isOffPeak ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" :
            "bg-blue-500/20 text-blue-500 border border-blue-500/30"
          }`}>
            ₹{tariffRate}/kWh ({isPeak ? "Peak" : isOffPeak ? "Off-Peak" : "Normal"})
          </span>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[var(--text-secondary)]">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-0.5 bg-gray-400 inline-block"></span>
              <span>Baseline Load:</span>
            </span>
            <span className="font-mono font-bold text-[var(--text-primary)]">{data.baseline_load_kw} kW</span>
          </div>

          <div className="flex justify-between items-center text-emerald-500">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Proposed Load:</span>
            </span>
            <span className="font-mono font-bold">{data.proposed_load_kw} kW</span>
          </div>

          <div className="flex justify-between items-center text-amber-500">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Solar Gen:</span>
            </span>
            <span className="font-mono font-bold">{data.solar_kw} kW</span>
          </div>

          <div className="flex justify-between items-center text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
            <span>Forecast Band (10-90%):</span>
            <span className="font-mono">{data.q10_kw} - {data.q90_kw} kW</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function DemandChart({ chartData }) {
  const { theme } = useTheme();

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-80 glass-panel rounded-2xl flex items-center justify-center text-[var(--text-muted)]">
        Loading 24h demand chart...
      </div>
    );
  }

  const formattedData = chartData.map(item => ({
    ...item,
    prediction_interval: [item.q10_kw, item.q90_kw]
  }));

  const axisStroke = theme === "dark" ? "#64748b" : "#475569";
  const gridStroke = theme === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";
  const peakFill = theme === "dark" ? "#ef4444" : "#f87171";
  const offPeakFill = theme === "dark" ? "#10b981" : "#34d399";

  return (
    <div className="glass-panel p-5 rounded-2xl border border-[var(--border-color)] space-y-4">
      
      {/* Header & Tariff Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center space-x-2">
            <span>24-Hour Energy Load & Solar PV Schedule</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              LIVE MILP SOLVED
            </span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Compare baseline demand vs proposed smart schedule with solar overlay and Time-of-Day tariff zones.
          </p>
        </div>

        {/* Tariff Legend */}
        <div className="flex items-center space-x-3 text-xs bg-[var(--bg-surface-elevated)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
          <span className="text-[var(--text-muted)] font-medium">Tariff Slots:</span>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[var(--text-secondary)] font-medium">Off-Peak (₹4.5)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-[var(--text-secondary)] font-medium">Normal (₹7.0)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-[var(--text-secondary)] font-bold">Peak (₹11.0)</span>
          </div>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-80 sm:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            
            {/* Shaded Tariff Background Zones */}
            <ReferenceArea x1="17:00" x2="21:00" y1={0} fill={peakFill} fillOpacity={theme === "dark" ? 0.08 : 0.12} label={{ value: 'PEAK TARIFF (₹11/kWh)', fill: '#ef4444', fontSize: 10, fontWeight: 700, position: 'insideTop' }} />
            <ReferenceArea x1="00:00" x2="06:00" y1={0} fill={offPeakFill} fillOpacity={theme === "dark" ? 0.04 : 0.07} />
            <ReferenceArea x1="22:00" x2="23:00" y1={0} fill={offPeakFill} fillOpacity={theme === "dark" ? 0.04 : 0.07} />

            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="time_label"
              stroke={axisStroke}
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke={axisStroke}
              fontSize={11}
              tickLine={false}
              unit=" kW"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 10, fontSize: 12, color: axisStroke }}
              iconType="circle"
            />

            {/* 1. Prediction Interval Band */}
            <Area
              type="monotone"
              dataKey="prediction_interval"
              name="Forecast Uncertainty (10-90%)"
              stroke="none"
              fill="#06b6d4"
              fillOpacity={theme === "dark" ? 0.15 : 0.25}
            />

            {/* 2. Solar PV Area */}
            <Area
              type="monotone"
              dataKey="solar_kw"
              name="Solar PV Surplus (kW)"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="#f59e0b"
              fillOpacity={theme === "dark" ? 0.25 : 0.35}
            />

            {/* 3. Baseline Load (Dashed) */}
            <Line
              type="monotone"
              dataKey="baseline_load_kw"
              name="Baseline Load (Unoptimized)"
              stroke={theme === "dark" ? "#94a3b8" : "#64748b"}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* 4. Proposed Load (Solid Emerald) */}
            <Line
              type="monotone"
              dataKey="proposed_load_kw"
              name="Proposed Smart Schedule"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 3, fill: "#10b981" }}
              activeDot={{ r: 6, fill: "#34d399" }}
            />

          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
