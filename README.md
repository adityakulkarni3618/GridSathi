# GridSathi (PS-19: AI Energy Forecasting & Smart Demand Scheduling)

[![SDG 7](https://img.shields.io/badge/SDG_7-Affordable_&_Clean_Energy-yellow.svg)](https://sdgs.un.org/goals/goal7)
[![SDG 9](https://img.shields.io/badge/SDG_9-Industry_&_Innovation-orange.svg)](https://sdgs.un.org/goals/goal9)
[![SDG 13](https://img.shields.io/badge/SDG_13-Climate_Action-green.svg)](https://sdgs.un.org/goals/goal13)

**GridSathi** is an AI-powered decision-support dashboard for small commercial buildings, educational campuses, hostels, and microgrids. It delivers next-24h demand forecasting using LightGBM gradient boosting, mixed-integer linear programming (MILP) load optimization via PuLP, interactive scenario stress-testing, and human-in-the-loop decision governance.

---

## 🚀 Quick Start (One Command Each)

### 1. Backend (Python + FastAPI + LightGBM + PuLP)
On Windows systems, use the `py -3.12` launcher to bypass Application Control policy restrictions on direct `pip.exe` execution:

```powershell
# Navigate to project root
cd e:\GridSathi

# Install backend dependencies (using python module to bypass pip.exe block)
py -3.12 -m pip install -r backend/requirements.txt

# Launch FastAPI server (Runs on http://localhost:8000)
py -3.12 backend/run.py
```
*Alternatively, double click or run `.\run_backend.bat` in the project root.*

### 2. Frontend (Next.js 14/15 + Tailwind + Recharts)
```powershell
# Navigate to frontend directory
cd e:\GridSathi\frontend

# Install dependencies (if needed)
npm install

# Launch Next.js dev server (Runs on http://localhost:3000)
npm run dev
```
*Alternatively, double click or run `.\run_frontend.bat` in the project root.*

---

## 💡 Key Features

1. **LightGBM 24h Demand Forecast & Uncertainty Bands**:
   - Predicts hourly building electric load using historical lags, calendar features, and weather telemetry.
   - Evaluates against a **Seasonal Naive baseline**, calculating **MAE** and **MAPE**.
   - Generates 10th & 90th percentile **prediction interval bands** via LightGBM quantile regression.

2. **PuLP MILP Smart Demand Scheduler**:
   - Mixed Integer Linear Programming solver that reschedules flexible loads (*Water Pump, Commercial Laundry, EV Charger, Geyser*) into solar surplus hours and off-peak tariff slots.
   - Multiobjective optimization with customizable sliders: **Cost Minimization**, **Peak Shaving**, and **Carbon Reduction**.
   - Generates plain-language rationales (e.g. *"Shifted from 19:00 peak tariff (₹11/kWh) to 13:00 solar surplus (7.2 kW)"*).
   - **Immutable Critical Loads**: Critical infrastructure (*IT Server Room, Emergency Lighting*) are locked and never rescheduled.

3. **Human-In-The-Loop Governance & SQLite Audit Log**:
   - Operators can **Approve** or **Reject** any suggested shift.
   - Only approved load shifts update proposed demand curves and savings metrics.
   - Every human action is recorded in an immutable SQLite `audit_logs` database table.

4. **Scenario Simulator**:
   - One-click stress testing: **+20% Demand Surge**, **Cloud Cover (-50% Solar)**, and **Extreme Heatwave (+30% HVAC)**.
   - Real-time recalculation of grid safety headroom margins.

5. **Responsible AI Disclosure (`/responsible-ai`)**:
   - Full disclosure of datasets, algorithms, assumptions (Time-Of-Day tariffs, carbon factors), limitations, and human control policies.

---

## ⚡ 2-Minute Demo Recording Walkthrough

1. Open the dashboard at `http://localhost:3000`.
2. Click **"⚡ Load Demo Scenario"** in the top navigation bar.
3. Observe the top **KPI Cards**: Peak reduction (e.g., 53.6 kW → 40.2 kW, -25.0%), daily ₹ savings, kg CO₂ avoided, and model MAPE.
4. Hover over the **Recharts Demand Graph** to inspect the 10-90% forecast uncertainty band, baseline vs proposed curves, solar PV curve, and color-coded Time-of-Day tariff zones.
5. Move the **MILP Optimization Weight Sliders** to adjust priority between Energy Cost, Peak Shaving, and Carbon Reduction.
6. Scroll to the **Smart Schedule Suggestions Table**. Click **Approve** or **Reject** on a load shift (e.g., Fleet EV Charger) and watch proposed peak kW and savings update dynamically!
7. Click **"Audit Log"** to view timestamped decision records.
8. Click **"Scenario Sim"** to test a **+20% Demand Surge**.
9. Click **"Responsible AI"** to view governance, datasets, and model disclosures.

---

## 🧪 Unit Tests

Run pytest using Python 3.12:
```powershell
py -3.12 -m pytest backend/tests/
```

---

## 📊 Configurable Assumptions

- **Off-Peak Tariff**: ₹4.5 / kWh (22:00 - 06:00)
- **Normal Tariff**: ₹7.0 / kWh (06:00 - 17:00, 21:00 - 22:00)
- **Peak Tariff**: ₹11.0 / kWh (17:00 - 21:00)
- **Demand Charge Rate**: ₹250 / peak kW / month
- **Grid Carbon Factor**: 0.72 kg CO₂ / kWh
- **Solar Capacity**: 10 kW PV Array (Pune location: 18.52° N, 73.85° E)
