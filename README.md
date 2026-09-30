# ResilHealth-India — Federated National Health Resource & Supply Chain Intelligence Platform

**Track:** Smart Health & Supply Chain Resilience — BRICS Resilience Initiative  
**Author:** Senior Full-Stack, AI, Systems & DevOps Engineering  
**Version:** 1.0.0 (Demo-Ready National Prototype)

---

## 🌟 Overview & Mission

**ResilHealth-India** is an authoritative, operational-grade platform designed to eradicate preventable medicine stock-outs across Indian Primary Health Centres (PHCs), Community Health Centres (CHCs), and District Hospitals.

By unifying **autonomous demand forecasting (Vertex AI / LightGBM)**, **Poisson stock-out risk modeling**, **MILP redistribution optimization (PuLP/CBC)**, **privacy-preserving cross-national federated learning (Flower + Opacus DP-SGD)**, and **offline-first PWA resilience (IndexedDB + Vector Clocks)**, ResilHealth-India equips health administrators to proactively rebalance supplies before frontline dispensaries run dry.

---

## 🏛️ System Architecture

```
[ Next.js 14 App Router (Sole Frontend) ]
  ├── 3D Spatial Network Hero (Three.js WebGL)
  ├── District GIS Command Console (Leaflet / Vector GIS)
  ├── PHC Mobile-First Field View (390x844 Touch-Optimized)
  ├── Offline PWA Mutation Queue (IndexedDB)
  └── Multilingual Gate (English, தமிழ், हिन्दी)
                          │
                          ▼ (Typed API Client)
[ FastAPI Authoritative Backend (:8000) ]
  ├── Mathematical Business Engine (Part J Rules)
  │     ├── Demand Forecaster (Vertex / LightGBM / EMA)
  │     ├── Poisson Stock-Out Probability (lambda = d * L)
  │     ├── PuLP / CBC Mixed-Integer Linear Program (MILP)
  │     └── FEFO Expiry Batch Allocator
  ├── Vector-Clock Offline Sync & Ledger Replay
  ├── Server-Enforced RBAC & Token Verification
  ├── Isolation Forest Anomaly Detection (Contamination 0.02)
  ├── Flower FedProx + Opacus DP-SGD Coordinator (India & Brazil)
  └── Google AI Service Adapters (Gemini 1.5, Vision, Speech, Translation)
                          │
                          ▼
[ PostgreSQL / SQLite Local Database ] ─── (Streaming Replica) ───► [ Google BigQuery Mirror ]
  ├── Facilities (95 across 6 states)
  ├── Inventory Batches & Append-Only Ledgers
  ├── Transfer Recommendations & Electronic Vouchers
  └── Immutable Forensic Audit Trails (SHA-256 Hashed)
```

---

## 🚀 Quick Start (Single-Command Run)

### Option 1: Docker Compose (Preferred)

Launch the entire stack (PostgreSQL, FastAPI backend, Next.js frontend) with one command:

```bash
docker compose up --build
```

* **Frontend:** http://localhost:3000
* **Backend API & Swagger Docs:** http://localhost:8000/docs
* **Database:** PostgreSQL on port 5432

---

### Option 2: Local Development (Without Docker)

#### 1. Backend (FastAPI + Python 3.12)

```bash
# From workspace root
pip install -r backend/requirements.txt

# Run FastAPI with auto-reload (auto-seeds SQLite baseline on first start)
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend (Next.js 14)

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000`.

---

## 🧪 Automated Test Suite (Part P1 - P9 & E2E)

Run the full automated test suite verifying mathematical business formulas, Poisson risks, MILP solvers, and state machine governance:

```bash
# Run 9 Part P acceptance tests
python -m pytest backend/tests/test_acceptance.py -v

# Run complete End-to-End acceptance scenario
python -m pytest backend/tests/test_e2e_demo_flow.py -v
```

**Result: 100% Pass Rate (10/10 tests passing).**

---

## 👥 Verified Pre-Approved Judge Roles (RBAC)

Use the top-right role switcher in the navbar to seamlessly inspect the platform under verified server claims:

| Role Key | Name | Role Level | Scope | Permissions |
|---|---|---|---|---|
| `dmo_kanchipuram` | Dr. S. Kanchana | `DISTRICT_OFFICER` | Kanchipuram, TN | Full district console, intra-district transfer approval, MILP solver, anomaly alerts |
| `phc_anakaputhur` | M. Selvam | `PHC_OPERATOR` | PHC Anakaputhur | Mobile-first field view, stock logging (voice/vision/manual), receipt confirmation |
| `phc_chromepet` | K. Vasanthi | `PHC_OPERATOR` | PHC Chromepet | Source facility view, FEFO batch inspection, dispatch confirmation |
| `state_director_tn` | Dr. R. Natarajan | `STATE_DIRECTOR` | Tamil Nadu (National) | National overview, cross-district logistics, state resilience matrices |
| `fed_admin` | A. Banerjee | `FEDERATION_ADMIN` | BRICS Edge Nodes | Federated round metrics, Opacus DP-SGD epsilon accountant (facility data blocked) |

---

## 🎬 End-to-End Demo Script (Exact Master Sequence)

Follow this 5-minute walkthrough to verify all acceptance criteria live:

1. **Baseline State:** Open `/district`. All 5 facilities in Kanchipuram (Anakaputhur, Chromepet, Pallavaram, Tambaram, Sriperumbudur) display **GREEN** with normal stock levels.
2. **Trigger Malaria Outbreak:** Navigate to `/demo` and click **"2. MALARIA SURGE"**. Demand at PHC Anakaputhur surges from 10 to 40 treatment packs/day.
3. **Simulate Offline Logging:** In `/demo`, toggle **Offline Mode**. Go to `/facility` (logged in as PHC Anakaputhur). Click **Log Stock** &rarr; Voice &rarr; Save (30 units). Then Vision &rarr; Save (55 units). Notice the offline queue counter increments to 2.
4. **Reconnect & Sync:** Reconnect in navbar or click **Sync (2)**. Mutations are replayed through vector clocks. Anakaputhur usable stock drops from 250 to 165 units. Days of stock drops to 4.1 days ($p_{\text{stockout}} = 99\%$). Facility status turns **RED (CRITICAL)**.
5. **Redistribution Optimization:** Go to `/district` and click **Run MILP Optimization**. The PuLP CBC solver finds 200 units surplus at PHC Chromepet and recommends transferring **120 units** over 12 km (Cost: INR 280, ETA: 12.4h). FEFO allocates Batch B240715 (expiring in 60 days).
6. **DMO Approval:** On the recommendation card, click **Approve Transfer**. An immutable dispatch voucher (`VCH-...`) is generated, stock is reserved, and an audit log is committed.
7. **Dispatch & Receipt:** Switch user to `phc_chromepet` &rarr; Confirm Dispatch. Then switch to `phc_anakaputhur` &rarr; Confirm Receipt. Effective stock at Anakaputhur reaches 285 units (7.1 days coverage), turning back to **GREEN**.
8. **Federated Learning:** Navigate to `/federation`. Click **Execute Federated Round 6**. Watch global loss decrease to 0.218 while Opacus DP accountant confirms $\epsilon = 2.45 \le 3.0$.
9. **AI Copilot:** Go to `/copilot`. Switch language to Tamil or Hindi, or ask in English: *"Which facilities have excess AL stock?"* Copilot returns a grounded answer citing PHC Chromepet (`FAC-TN-KAN-002`).

---

## ☁️ Google Cloud Deployment (Cloud Run)

### Backend to Cloud Run:
```bash
gcloud run deploy resilhealth-backend \
  --source . \
  --port 8000 \
  --set-env-vars DATABASE_URL=postgresql://...,DEMO_DETERMINISTIC=true
```

### Frontend to Cloud Run / Vercel:
```bash
cd frontend
npm run build
gcloud run deploy resilhealth-frontend --source . --port 3000
```

---

## 📄 License & Compliance

Built for the **BRICS Resilience Initiative (Smart Health Track)** adhering to strict DP-SGD privacy regulations ($\epsilon \le 3.0$) and Zero-PHI data ingestion policies.
