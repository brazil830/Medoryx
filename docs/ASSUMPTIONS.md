# System Assumptions & Technical Design Decisions

**Platform:** ResilHealth-India — Federated National Health Resource & Supply Chain Intelligence Platform  
**Track:** Smart Health & Supply Chain Resilience — BRICS Resilience Initiative  
**Date:** 2026-09-30 (Deterministic Clock Base)

---

## 1. Authoritative State & Database Hierarchy

* **PostgreSQL / SQLite Dual Engine:** In local zero-setup environments, the system seamlessly defaults to SQLite (`sqlite:///./resilhealth.db`) with `check_same_thread=False` and identical SQLAlchemy ORM models. For Docker and Cloud Run deployments, `DATABASE_URL` targets PostgreSQL.
* **Deterministic Clock:** When `DEMO_DETERMINISTIC=true`, the system clock is anchored to `2026-09-30` in Indian Standard Time (IST). All batch shelf-life checks, SLA expirations, and Poisson forecasts derive from this date rather than local developer host machine clocks.

---

## 2. Supply Chain Mathematical Parameters

* **Artemether-Lumefantrine (AL) Essential Drug:**
  * Dispensing Unit: 1 treatment pack
  * Standard Transfer Unit: Multiple of $P = 10$ packs
  * Minimum Shelf Life Threshold: $7$ days (batches expiring sooner are excluded from usable stock and marked as write-off / at-risk)
  * FEFO Safety Margin: Batches allocated for inter-facility redistribution must have $\ge 30$ days remaining upon expected arrival date
  * Lead Time ($L$): $5$ days
  * Safety Buffer Days ($S$): $2$ days for AL; $7$ days for other essential drugs (Paracetamol, ORS, Amoxicillin)
  * Replenishment Horizon ($T$): $L + S = 5 + 2 = 7$ days for AL

---

## 3. Mathematical Optimization & Fallbacks

* **MILP Redistribution Solver:**
  * Primary: PuLP with COIN-OR CBC branch-and-cut solver (time limit: 4 seconds).
  * Objective: Minimizes deficit penalties ($W_j \cdot u_j$) + transport costs ($a \cdot \text{dist}_{ij} - b \cdot \text{expiry\_bonus}_i$).
  * Fallback: Deterministic Greedy Heuristic prioritizing sinks by urgency descending (`CRITICAL` &rarr; `HIGH` &rarr; `MEDIUM` &rarr; `LOW`) and candidate sources by road distance ascending.
  * Maximum Intra-District Road Radius: 40 km. Transfers exceeding 40 km escalate to State Director for cross-district authorization.
  * Transport Cost Model: $\text{INR } 100 + 15 \times \text{distance\_km}$.
  * Transit ETA: $12\text{h (dispatch lag)} + \frac{\text{distance}}{30\text{ km/h}}$.

---

## 4. Google AI Grounding & Provider Fallbacks

* **Grounded Narrative Explanations:**
  * If `GEMINI_API_KEY` is provided, requests call Gemini 1.5 Flash.
  * If absent or if latency exceeds 3 seconds, the system activates a fact-bounded deterministic template utilizing the exact calculated numbers ($d$, $p_{\text{stockout}}$, distance, cost, ETA, at-risk units). The UI explicitly displays `DEMO_FALLBACK` or `REAL` status badges.
* **Privacy-Preserving Vision & Speech:**
  * Images and voice audio are processed transiently in memory.
  * Aadhaar sequences (12 digits) and phone numbers (10 digits) are redacted via regex prior to LLM parsing.
  * In compliance with Part K3, automated extractions NEVER auto-save to the authoritative database; explicit user validation and save confirmation are mandatory.

---

## 5. Federated Learning Scope & BRICS Nodes

* **Architecture:** Simulates cross-national edge nodes (India and Brazil) using PyTorch / Flower FedProx and Opacus DP-SGD accountant.
* **Privacy Budget:** Maximum cumulative epsilon budget is capped at $\epsilon \le 3.0$ with $\delta = 10^{-5}$. If an additional round would breach $\epsilon = 3.0$, training is halted.
* **RBAC Privacy Boundary:** The `FEDERATION_ADMIN` role receives aggregate loss and telemetry metrics only. By design, facility-level identifiers, individual facility names, and local demand ledgers are inaccessible through both the UI and Copilot.
