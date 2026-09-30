"""
End-to-End Automated Demo Scenario Test for MedOryx-India.
Complies with Part AI & Part AY of the Master Build Specification.
Executes the exact sequence:
1. Baseline: all 5 Kanchipuram PHCs GREEN
2. Trigger Malaria Surge: Demand d=40/day at Anakaputhur
3. Offline stock logging: 30 voice + 55 vision = 85 units issued
4. Sync & Reconnection: stock drops to 165, days_remaining = 4.1, Poisson risk >= 0.95 (RED, CRITICAL)
5. Redistribution Optimization: Chromepet surplus 200, Deficit 120, Transfer 120, FEFO B240715, Cost INR 280, ETA 12.4h
6. DMO Approval: State transition PENDING -> APPROVED, voucher generated, audit logged
7. Dispatch & Receipt: TRANSFER_OUT & TRANSFER_IN, effective stock 285, status restored to GREEN
8. Federated Learning: Round 6 executed, loss decreases, epsilon <= 3.0
9. Grounded Copilot Query: verified citations
"""

import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, init_db
from app.seed.seed_data import seed_database
from app.models.models import Facility, InventoryBatch, TransferRecommendation, AuditLog, DemoScenario

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_e2e():
    init_db()
    with SessionLocal() as db:
        seed_database(db)
    yield

def test_full_acceptance_scenario_part_ay():
    # -------------------------------------------------------------
    # STEP 1: BASELINE (5 Kanchipuram PHCs GREEN)
    # -------------------------------------------------------------
    kan_facs = ["FAC-TN-KAN-001", "FAC-TN-KAN-002", "FAC-TN-KAN-003", "FAC-TN-KAN-004", "FAC-TN-KAN-005"]
    for fac_id in kan_facs:
        res = client.get(f"/inventory/facility/{fac_id}", headers={"Authorization": "Bearer dmo_kanchipuram"})
        assert res.status_code == 200
        data = res.json()
        assert data["facility"]["overall_status"] == "GREEN"

    # National view check
    nat_res = client.get("/analytics/national", headers={"Authorization": "Bearer state_director_tn"})
    assert nat_res.status_code == 200
    assert nat_res.json()["total_facilities"] >= 90

    # -------------------------------------------------------------
    # STEP 2: TRIGGER MALARIA SURGE AT ANAKAPUTHUR
    # -------------------------------------------------------------
    surge_res = client.post(
        "/demo/scenario",
        json={"scenario": "MALARIA_SURGE", "outbreak_spike_active": True},
        headers={"Authorization": "Bearer dmo_kanchipuram"}
    )
    assert surge_res.status_code == 200
    assert surge_res.json()["outbreak_spike_active"] is True

    # -------------------------------------------------------------
    # STEP 3: OFFLINE STOCK ISSUES (30 voice + 55 vision = 85 units)
    # -------------------------------------------------------------
    # Voice parse test
    voice_res = client.post("/ai/voice/parse", data={"transcript": "Issued 30 Artemether packs for outpatient malaria"})
    assert voice_res.status_code == 200
    voice_data = voice_res.json()
    assert voice_data["quantity"] == 30

    # Vision extract test
    vision_res = client.post("/ai/vision/extract", data={"filename": "medicine_box.jpg"})
    assert vision_res.status_code == 200
    vision_data = vision_res.json()
    assert vision_data["quantity"]["value"] == 55

    # -------------------------------------------------------------
    # STEP 4: RECONNECT & SYNC VECTOR-CLOCK MUTATIONS
    # -------------------------------------------------------------
    sync_payload = {
        "client_id": "phc-anakaputhur-pwa",
        "last_sync_vector_clock": 0,
        "mutations": [
            {
                "mutation_id": "MUT-VOICE-30",
                "timestamp": "2026-09-30T10:05:00Z",
                "entity_type": "INVENTORY_LEDGER",
                "payload": {
                    "drug_id": "DRUG-AL-01",
                    "batch_number": "B240601",
                    "action_type": "ISSUE",
                    "quantity": 30,
                    "recipient_category": "OUTPATIENT_MALARIA"
                },
                "vector_clock": 1
            },
            {
                "mutation_id": "MUT-VISION-55",
                "timestamp": "2026-09-30T10:06:00Z",
                "entity_type": "INVENTORY_LEDGER",
                "payload": {
                    "drug_id": "DRUG-AL-01",
                    "batch_number": "B240601",
                    "action_type": "ISSUE",
                    "quantity": 55,
                    "recipient_category": "OUTPATIENT_MALARIA"
                },
                "vector_clock": 2
            }
        ]
    }
    sync_res = client.post(
        "/api/v1/inventory/sync",
        json=sync_payload,
        headers={"Authorization": "Bearer phc_anakaputhur"}
    )
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert len(sync_data["processed_mutations"]) == 2

    # Verify updated inventory: stock dropped from 250 to 165
    ana_inv = client.get("/inventory/facility/FAC-TN-KAN-001", headers={"Authorization": "Bearer dmo_kanchipuram"}).json()
    al_item = next(item for item in ana_inv["inventory"] if item["drug_id"] == "DRUG-AL-01")
    assert al_item["usable_stock"] == 165
    assert al_item["days_of_stock"] <= 4.2
    assert al_item["p_stockout"] >= 0.95
    assert al_item["status"] == "RED"

    # -------------------------------------------------------------
    # STEP 5: RUN MILP REDISTRIBUTION OPTIMIZATION
    # -------------------------------------------------------------
    opt_res = client.post(
        "/optimization/redistribute?district=Kanchipuram&drug_id=DRUG-AL-01",
        headers={"Authorization": "Bearer dmo_kanchipuram"}
    )
    assert opt_res.status_code == 200
    opt_data = opt_res.json()
    assert opt_data["recommendations_generated"] >= 1

    # Fetch recommendation cards
    recs_res = client.get("/optimization/recommendations?district=Kanchipuram", headers={"Authorization": "Bearer dmo_kanchipuram"})
    assert recs_res.status_code == 200
    recs = recs_res.json()["recommendations"]
    assert len(recs) >= 1

    rec = recs[0]
    assert rec["quantity"] == 120
    assert rec["distance_km"] == 12.0
    assert rec["transport_cost_inr"] == 280.0
    assert rec["eta_hours"] == 12.4
    assert rec["urgency"] == "CRITICAL"
    assert rec["status"] == "PENDING"
    assert "PHC Chromepet" in rec["gemini_explanation"]

    # -------------------------------------------------------------
    # STEP 6: DMO APPROVAL (State Machine Transition)
    # -------------------------------------------------------------
    appr_res = client.post(
        f"/optimization/recommendations/{rec['id']}/approve",
        json={"adjusted_quantity": None},
        headers={"Authorization": "Bearer dmo_kanchipuram"}
    )
    assert appr_res.status_code == 200
    appr_data = appr_res.json()
    assert appr_data["status"] == "APPROVED"
    assert appr_data["voucher_id"].startswith("VCH-")

    # Verify voucher FEFO allocation uses B240715 first
    allocated_batches = appr_data["dispatch_voucher"]["allocated_batches"]
    assert len(allocated_batches) >= 1
    assert allocated_batches[0]["batch_number"] == "B240715"
    assert allocated_batches[0]["quantity"] == 120

    # -------------------------------------------------------------
    # STEP 7: DISPATCH & RECEIPT CONFIRMATION
    # -------------------------------------------------------------
    # Source confirms dispatch
    disp_res = client.post(
        f"/optimization/recommendations/{rec['id']}/dispatch",
        headers={"Authorization": "Bearer phc_chromepet"}
    )
    assert disp_res.status_code == 200
    assert disp_res.json()["status"] == "DISPATCHED"

    # Destination confirms receipt
    recv_res = client.post(
        f"/optimization/recommendations/{rec['id']}/receive",
        headers={"Authorization": "Bearer phc_anakaputhur"}
    )
    assert recv_res.status_code == 200
    assert recv_res.json()["status"] == "COMPLETED"

    # Verify Anakaputhur stock is restored
    ana_restored = client.get("/inventory/facility/FAC-TN-KAN-001", headers={"Authorization": "Bearer dmo_kanchipuram"}).json()
    al_restored = next(item for item in ana_restored["inventory"] if item["drug_id"] == "DRUG-AL-01")
    # 165 + 120 = 285 units
    assert al_restored["usable_stock"] == 285
    assert al_restored["days_of_stock"] >= 7.0
    assert al_restored["status"] == "GREEN"

    # Verify Chromepet stock
    chrome_restored = client.get("/inventory/facility/FAC-TN-KAN-002", headers={"Authorization": "Bearer dmo_kanchipuram"}).json()
    al_chrome = next(item for item in chrome_restored["inventory"] if item["drug_id"] == "DRUG-AL-01")
    # 221 - 120 = 101 units
    assert al_chrome["usable_stock"] == 101
    assert al_chrome["status"] == "GREEN"

    # Verify audit sequence
    audit_res = client.get("/audit/logs", headers={"Authorization": "Bearer dmo_kanchipuram"})
    assert audit_res.status_code == 200
    logs = audit_res.json()["logs"]
    actions = [l["action"] for l in logs]
    assert "TRANSFER_APPROVED" in actions
    assert "TRANSFER_DISPATCHED" in actions
    assert "TRANSFER_COMPLETED" in actions

    # -------------------------------------------------------------
    # STEP 8: RUN FEDERATED ROUND 6
    # -------------------------------------------------------------
    fed_res = client.post("/federation/run-round", headers={"Authorization": "Bearer fed_admin"})
    assert fed_res.status_code == 200
    fed_data = fed_res.json()
    assert fed_data["success"] is True
    assert fed_data["round_number"] == 6
    assert fed_data["global_loss"] < 0.245
    assert fed_data["epsilon"] <= 3.0

    # -------------------------------------------------------------
    # STEP 9: GROUNDED COPILOT QUERY
    # -------------------------------------------------------------
    copilot_res = client.post(
        "/ai/copilot",
        json={"query": "Which facilities have excess AL stock?", "language": "en"},
        headers={"Authorization": "Bearer dmo_kanchipuram"}
    )
    assert copilot_res.status_code == 200
    copilot_data = copilot_res.json()
    assert "FAC-TN-KAN-002" in copilot_data["citations"] or "Chromepet" in copilot_data["response"]
