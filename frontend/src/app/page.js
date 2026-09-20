"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import KpiCards from "../components/KpiCards";
import DemandChart from "../components/DemandChart";
import BatteryStorageCard from "../components/BatteryStorageCard";
import LiveIoTTelemetryTicker from "../components/LiveIoTTelemetryTicker";
import WeightSliders from "../components/WeightSliders";
import ScheduleTable from "../components/ScheduleTable";
import AnomalyAlertCard from "../components/AnomalyAlertCard";
import ScenarioDrawer from "../components/ScenarioDrawer";
import AuditLogModal from "../components/AuditLogModal";
import ConfigModal from "../components/ConfigModal";

import {
  fetchDashboardData,
  triggerDemoLoad,
  updateOptimizationWeights,
  submitScheduleAction,
  runScenarioSimulation
} from "../lib/api";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'audit', 'config', 'scenario', null
  const [selectedBuilding, setSelectedBuilding] = useState("Main Campus Block A");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchDashboardData();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDemoLoad = async () => {
    try {
      setIsDemoLoading(true);
      const res = await triggerDemoLoad();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleScheduleAction = async (deviceId, action) => {
    try {
      setIsLoadingAction(true);
      const res = await submitScheduleAction(deviceId, action);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleWeightsChange = async (weights) => {
    try {
      const res = await updateOptimizationWeights(weights);
      setData(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScenarioSelect = async (scenarioType) => {
    try {
      setLoading(true);
      const res = await runScenarioSimulation(scenarioType);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto animate-spin">
            ⚡
          </div>
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Initializing GridSathi Telemetry & BESS MILP Pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans pb-16 grid-bg-pattern transition-colors duration-300">
      
      {/* Sticky Top Navigation */}
      <Navbar
        onLoadDemo={handleDemoLoad}
        onOpenAuditLog={() => setActiveModal("audit")}
        onOpenConfig={() => setActiveModal("config")}
        onOpenScenario={() => setActiveModal("scenario")}
        isDemoLoading={isDemoLoading}
        activeScenario={data?.scenario?.active}
        selectedBuilding={selectedBuilding}
        onBuildingSelect={setSelectedBuilding}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* 1. Live IoT Telemetry Bar */}
        <LiveIoTTelemetryTicker />

        {/* 2. KPI Summary Cards */}
        <KpiCards
          kpis={data?.kpis}
          forecastMetrics={data?.forecast_metrics}
          dataFreshness={data?.data_freshness}
        />

        {/* 3. BESS Battery Storage Card (Stretch Goal) */}
        <BatteryStorageCard batterySeries={data?.battery_series} />

        {/* 4. Interactive Demand & Solar Recharts Chart */}
        <DemandChart chartData={data?.chart_series} />

        {/* 5. MILP Weight Sliders */}
        <WeightSliders
          weights={data?.config?.weights}
          onWeightsChange={handleWeightsChange}
        />

        {/* 6. Smart Schedule Recommendations Table */}
        <ScheduleTable
          schedule={data?.schedule}
          criticalLoads={data?.critical_loads}
          onAction={handleScheduleAction}
          isLoadingAction={isLoadingAction}
        />

        {/* 7. Anomaly Alerts Card */}
        <AnomalyAlertCard anomalies={data?.anomalies} />

      </main>

      {/* Modals & Drawers */}
      <ScenarioDrawer
        isOpen={activeModal === "scenario"}
        onClose={() => setActiveModal(null)}
        onSelectScenario={handleScenarioSelect}
        activeScenario={data?.scenario?.active}
        safetyMarginKw={data?.scenario?.safety_margin_kw}
      />

      <AuditLogModal
        isOpen={activeModal === "audit"}
        onClose={() => setActiveModal(null)}
      />

      <ConfigModal
        isOpen={activeModal === "config"}
        onClose={() => setActiveModal(null)}
        configData={data?.config}
        onConfigUpdated={loadData}
      />

    </div>
  );
}
