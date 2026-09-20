const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchDashboardData() {
  const res = await fetch(`${API_BASE_URL}/api/dashboard`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  return res.json();
}

export async function triggerDemoLoad() {
  const res = await fetch(`${API_BASE_URL}/api/demo/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error("Failed to trigger demo load");
  return res.json();
}

export async function updateOptimizationWeights(weights) {
  const res = await fetch(`${API_BASE_URL}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(weights)
  });
  if (!res.ok) throw new Error("Failed to update optimization weights");
  return res.json();
}

export async function submitScheduleAction(deviceId, action) {
  const res = await fetch(`${API_BASE_URL}/api/schedule/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, action })
  });
  if (!res.ok) throw new Error("Failed to update schedule action");
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE_URL}/api/audit-log`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch audit log");
  return res.json();
}

export async function runScenarioSimulation(scenarioType) {
  const res = await fetch(`${API_BASE_URL}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_type: scenarioType })
  });
  if (!res.ok) throw new Error("Failed to run scenario simulation");
  return res.json();
}

export async function updateAppConfig(configPayload) {
  const res = await fetch(`${API_BASE_URL}/api/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configPayload)
  });
  if (!res.ok) throw new Error("Failed to update config");
  return res.json();
}
