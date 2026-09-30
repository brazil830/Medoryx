"""
Inventory and Offline Synchronization Endpoints for ResilHealth-India.
Complies with Part Q, J0, J8, and RBAC rules.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.core.database import get_db
from app.auth.rbac import decode_token
from app.models.models import Facility, Drug, InventoryBatch, TransferRecommendation, DemoScenario
from app.schemas.schemas import SyncRequest, SyncResponse
from app.sync.sync_engine import process_sync_batch
from app.engine.calculations import (
    calculate_usable_stock,
    calculate_effective_stock,
    calculate_days_remaining,
    calculate_poisson_stockout_risk,
    determine_status,
    calculate_at_risk_units
)
from app.core.rules_config import (
    get_current_date,
    get_lead_time,
    get_horizon_T
)

router = APIRouter(tags=["Inventory"])

@router.post("/api/v1/inventory/sync", response_model=SyncResponse)
def sync_inventory_batch(
    req: SyncRequest,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(decode_token)
):
    """
    Offline mutation batch synchronization with vector clocks and idempotency.
    """
    # Facility ID derived from user or mutations
    facility_id = user.get("facility_id") or "FAC-TN-KAN-001"
    raw_mutations = [m.model_dump() for m in req.mutations]

    result = process_sync_batch(
        db=db,
        facility_id=facility_id,
        client_id=req.client_id,
        last_sync_vector_clock=req.last_sync_vector_clock,
        mutations=raw_mutations,
        actor=user.get("name", "PHC Operator"),
        role=user.get("role", "PHC_OPERATOR")
    )
    return result

@router.get("/inventory/facility/{facility_id}")
def get_facility_inventory(
    facility_id: str,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(decode_token)
):
    """
    Retrieves full operational inventory state for a facility.
    Enforces strict RBAC: PHC_OPERATOR can only read their own facility.
    """
    if user.get("role") == "PHC_OPERATOR":
        user_fac = user.get("facility_id")
        if user_fac and user_fac != facility_id:
            # Map code if facility_id is code
            fac_by_code = db.query(Facility).filter(Facility.code == facility_id).first()
            if not fac_by_code or fac_by_code.id != user_fac:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": {
                            "code": "INSUFFICIENT_PERMISSION",
                            "message": f"PHC_OPERATOR is restricted to own facility ({user_fac}). Access to {facility_id} is forbidden."
                        }
                    }
                )

    if user.get("role") == "FEDERATION_ADMIN":
        raise HTTPException(
            status_code=403,
            detail={
                "error": {
                    "code": "INSUFFICIENT_PERMISSION",
                    "message": "FEDERATION_ADMIN has zero facility-level access."
                }
            }
        )

    # Locate facility by ID or Code
    fac = db.query(Facility).filter(
        (Facility.id == facility_id) | (Facility.code == facility_id)
    ).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")

    curr_date = get_current_date()

    # Check scenario for outbreak spike
    scenario = db.query(DemoScenario).filter(DemoScenario.id == "default-scenario").first()
    outbreak_active = scenario.outbreak_spike_active if scenario else False

    # Calculate reserved and incoming quantities from active transfers
    # Outgoing approved transfers where source is this facility -> reserved
    outgoing_recs = db.query(TransferRecommendation).filter(
        TransferRecommendation.source_facility_id == fac.id,
        TransferRecommendation.status == "APPROVED"
    ).all()
    reserved_map = {}
    for r in outgoing_recs:
        reserved_map[r.drug_id] = reserved_map.get(r.drug_id, 0) + r.quantity

    # Incoming approved or dispatched transfers where destination is this facility -> incoming
    incoming_recs = db.query(TransferRecommendation).filter(
        TransferRecommendation.destination_facility_id == fac.id,
        TransferRecommendation.status.in_(["APPROVED", "DISPATCHED"])
    ).all()
    incoming_map = {}
    for r in incoming_recs:
        incoming_map[r.drug_id] = incoming_map.get(r.drug_id, 0) + r.quantity

    # Query all batches for facility
    batches = db.query(InventoryBatch).filter(InventoryBatch.facility_id == fac.id).all()

    # Group batches by drug
    drugs = db.query(Drug).all()
    inventory_items = []
    facility_statuses = []

    for drug in drugs:
        drug_batches = [b for b in batches if b.drug_id == drug.id]
        if not drug_batches and drug.id != "DRUG-AL-01":
            continue

        batch_dicts = [
            {"batch_number": b.batch_number, "quantity": b.quantity, "expiry_date": b.expiry_date}
            for b in drug_batches
        ]

        usable = calculate_usable_stock(batch_dicts, curr_date)
        res = reserved_map.get(drug.id, 0)
        inc = incoming_map.get(drug.id, 0)
        eff = calculate_effective_stock(usable, res, inc)

        # Demand rate
        if drug.id == "DRUG-AL-01":
            if (fac.code == "PHC-Anakaputhur" or fac.id == "FAC-TN-KAN-001") and outbreak_active:
                d = 40.0
            elif fac.code == "PHC-Anakaputhur" or fac.id == "FAC-TN-KAN-001":
                d = 10.0
            elif fac.code == "PHC-Chromepet" or fac.id == "FAC-TN-KAN-002":
                d = 3.0
            elif fac.code == "PHC-Pallavaram" or fac.id == "FAC-TN-KAN-003":
                d = 5.0
            elif fac.code == "PHC-Tambaram" or fac.id == "FAC-TN-KAN-004":
                d = 8.0
            elif fac.code == "PHC-Sriperumbudur" or fac.id == "FAC-TN-KAN-005":
                d = 6.0
            else:
                d = 5.0
        else:
            d = 15.0

        lead_time = get_lead_time(drug.id)
        horizon_T = get_horizon_T(drug.id)
        days_rem = calculate_days_remaining(eff, d)
        p_risk = calculate_poisson_stockout_risk(eff, d, lead_time)
        status = determine_status(p_risk, days_rem, lead_time, horizon_T)
        facility_statuses.append(status)

        # Batch-level details and at-risk calculations
        batch_details = []
        for b in drug_batches:
            days_to_exp = (b.expiry_date - curr_date).days
            at_risk = calculate_at_risk_units(b.quantity, d, days_to_exp)
            batch_details.append({
                "batch_number": b.batch_number,
                "quantity": b.quantity,
                "expiry_date": b.expiry_date.isoformat(),
                "days_to_expiry": days_to_exp,
                "at_risk_units": at_risk,
                "is_usable": days_to_exp >= 7,
                "is_verified": b.is_verified
            })

        inventory_items.append({
            "drug_id": drug.id,
            "drug_name": drug.name,
            "unit": drug.unit,
            "pack_size": drug.pack_size,
            "usable_stock": usable,
            "reserved": res,
            "incoming": inc,
            "effective_stock": eff,
            "demand_per_day": d,
            "days_of_stock": days_rem,
            "p_stockout": p_risk,
            "status": status,
            "batches": batch_details
        })

    # Overall facility map status = worst status across essential drugs
    worst_status = "GREEN"
    if "RED" in facility_statuses:
        worst_status = "RED"
    elif "AMBER" in facility_statuses:
        worst_status = "AMBER"

    return {
        "facility": {
            "id": fac.id,
            "code": fac.code,
            "name": fac.name,
            "facility_type": fac.facility_type,
            "state": fac.state,
            "district": fac.district,
            "latitude": fac.latitude,
            "longitude": fac.longitude,
            "overall_status": worst_status,
            "lead_time_days": fac.lead_time_days
        },
        "inventory": inventory_items,
        "active_outbreak_spike": outbreak_active,
        "as_of_date": curr_date.isoformat()
    }
