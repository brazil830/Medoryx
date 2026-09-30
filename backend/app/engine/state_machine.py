"""
Authoritative Transfer State Machine for ResilHealth-India.
Complies with Part J (J7, J9) and Part Q/R of Master Specification.
"""

from datetime import datetime, timezone, timedelta
import hashlib
import json
import uuid
from typing import Dict, Any, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import (
    TransferRecommendation, InventoryBatch, InventoryLedger, AuditLog, Facility
)
from app.core.rules_config import (
    VALID_REJECTION_REASONS,
    get_current_date,
    get_pack_size
)
from app.engine.calculations import calculate_fefo_allocation

ALLOWED_TRANSITIONS = {
    "PENDING": ["APPROVED", "REJECTED", "EXPIRED"],
    "APPROVED": ["DISPATCHED", "CANCELLED"],
    "DISPATCHED": ["COMPLETED"],
    "REJECTED": [],
    "CANCELLED": [],
    "EXPIRED": [],
    "COMPLETED": []
}

def compute_payload_hash(data: Any) -> str:
    serialized = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def transition_transfer_state(
    db: Session,
    recommendation_id: str,
    target_status: str,
    actor: str,
    role: str,
    user_state: Optional[str] = None,
    user_district: Optional[str] = None,
    user_facility_id: Optional[str] = None,
    adjusted_quantity: Optional[int] = None,
    rejection_reason: Optional[str] = None,
    rejection_notes: Optional[str] = None
) -> TransferRecommendation:
    """
    Executes state-machine transition with server-side RBAC, validation, batch updates, voucher generation, and audit logging.
    """
    rec = db.query(TransferRecommendation).filter(TransferRecommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": f"Recommendation {recommendation_id} not found."}}
        )

    current_status = rec.status

    # Validate transition
    if target_status not in ALLOWED_TRANSITIONS.get(current_status, []):
        raise HTTPException(
            status_code=409,
            detail={
                "error": {
                    "code": "INVALID_STATE_TRANSITION",
                    "message": f"Transition from {current_status} to {target_status} is not allowed."
                }
            }
        )

    source_fac = db.query(Facility).filter(Facility.id == rec.source_facility_id).first()
    dest_fac = db.query(Facility).filter(Facility.id == rec.destination_facility_id).first()

    is_cross_district = (source_fac.district != dest_fac.district)

    # RBAC Enforcement (Part D & J9)
    if target_status == "APPROVED":
        if role == "PHC_OPERATOR":
            raise HTTPException(
                status_code=403,
                detail={"error": {"code": "INSUFFICIENT_PERMISSION", "message": "PHC_OPERATOR cannot approve transfers."}}
            )
        if role == "FEDERATION_ADMIN":
            raise HTTPException(
                status_code=403,
                detail={"error": {"code": "INSUFFICIENT_PERMISSION", "message": "FEDERATION_ADMIN has read-only federation scope."}}
            )
        if role == "DISTRICT_OFFICER":
            if is_cross_district:
                raise HTTPException(
                    status_code=403,
                    detail={"error": {"code": "INSUFFICIENT_PERMISSION", "message": "Cross-district transfers require STATE_DIRECTOR approval."}}
                )
            if user_district and user_district != source_fac.district:
                raise HTTPException(
                    status_code=403,
                    detail={"error": {"code": "INSUFFICIENT_PERMISSION", "message": f"District officer of {user_district} cannot approve transfers in {source_fac.district}."}}
                )

    if target_status == "REJECTED":
        if not rejection_reason or rejection_reason not in VALID_REJECTION_REASONS:
            raise HTTPException(
                status_code=422,
                detail={"error": {"code": "VALIDATION_ERROR", "message": f"Rejection reason must be one of {VALID_REJECTION_REASONS}"}}
            )
        if rejection_reason == "OTHER" and (not rejection_notes or not rejection_notes.strip()):
            raise HTTPException(
                status_code=422,
                detail={"error": {"code": "VALIDATION_ERROR", "message": "Rejection reason 'OTHER' requires free-text explanation."}}
            )

    # State specific actions
    qty_before = rec.quantity
    qty_after = rec.quantity

    if target_status == "APPROVED":
        final_qty = rec.quantity
        if adjusted_quantity is not None and adjusted_quantity > 0:
            pack_size = get_pack_size(rec.drug_id)
            if adjusted_quantity % pack_size != 0:
                raise HTTPException(
                    status_code=422,
                    detail={"error": {"code": "VALIDATION_ERROR", "message": f"Adjusted quantity must be a multiple of pack size P={pack_size}."}}
                )
            rec.adjusted_quantity = adjusted_quantity
            rec.quantity = adjusted_quantity
            final_qty = adjusted_quantity
            qty_after = adjusted_quantity

        # FEFO allocation from source batches
        source_batches = db.query(InventoryBatch).filter(
            InventoryBatch.facility_id == rec.source_facility_id,
            InventoryBatch.drug_id == rec.drug_id,
            InventoryBatch.quantity > 0
        ).all()

        batches_data = [
            {"batch_number": b.batch_number, "quantity": b.quantity, "expiry_date": b.expiry_date}
            for b in source_batches
        ]

        curr_date = get_current_date()
        allocated, unallocated = calculate_fefo_allocation(
            batches_data, final_qty, curr_date, eta_days=(rec.eta_hours / 24.0)
        )

        voucher_id = f"VCH-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        rec.voucher_id = voucher_id
        rec.dispatch_voucher_json = {
            "voucher_id": voucher_id,
            "issued_at": datetime.utcnow().isoformat(),
            "source_facility_id": rec.source_facility_id,
            "source_facility_name": source_fac.name,
            "destination_facility_id": rec.destination_facility_id,
            "destination_facility_name": dest_fac.name,
            "drug_id": rec.drug_id,
            "total_quantity": final_qty,
            "allocated_batches": allocated,
            "unallocated_quantity": unallocated,
            "eta_hours": rec.eta_hours,
            "transport_cost_inr": rec.transport_cost_inr
        }

    elif target_status == "DISPATCHED":
        # Deduct from source batches
        if rec.dispatch_voucher_json and "allocated_batches" in rec.dispatch_voucher_json:
            for item in rec.dispatch_voucher_json["allocated_batches"]:
                b_num = item["batch_number"]
                b_qty = item["quantity"]
                batch = db.query(InventoryBatch).filter(
                    InventoryBatch.facility_id == rec.source_facility_id,
                    InventoryBatch.drug_id == rec.drug_id,
                    InventoryBatch.batch_number == b_num
                ).first()
                if batch:
                    batch.quantity = max(0, batch.quantity - b_qty)

        # Log TRANSFER_OUT ledger
        ledger_entry = InventoryLedger(
            transaction_id=str(uuid.uuid4()),
            mutation_id=f"DISPATCH-{rec.id}",
            facility_id=rec.source_facility_id,
            drug_id=rec.drug_id,
            batch_number=rec.dispatch_voucher_json["allocated_batches"][0]["batch_number"] if rec.dispatch_voucher_json.get("allocated_batches") else "MULTI",
            action_type="TRANSFER_OUT",
            quantity=rec.quantity,
            vector_clock=1,
            client_id="dmo-console",
            payload_hash=compute_payload_hash({"rec_id": rec.id, "action": "TRANSFER_OUT"}),
            recipient_category="TRANSFER"
        )
        db.add(ledger_entry)

    elif target_status == "COMPLETED":
        # Add to destination batches
        if rec.dispatch_voucher_json and "allocated_batches" in rec.dispatch_voucher_json:
            for item in rec.dispatch_voucher_json["allocated_batches"]:
                b_num = item["batch_number"]
                b_qty = item["quantity"]
                b_exp = item["expiry_date"]
                if isinstance(b_exp, str):
                    from datetime import date
                    b_exp_date = date.fromisoformat(b_exp)
                else:
                    b_exp_date = b_exp

                dest_batch = db.query(InventoryBatch).filter(
                    InventoryBatch.facility_id == rec.destination_facility_id,
                    InventoryBatch.drug_id == rec.drug_id,
                    InventoryBatch.batch_number == b_num
                ).first()

                if dest_batch:
                    dest_batch.quantity += b_qty
                else:
                    db.add(InventoryBatch(
                        facility_id=rec.destination_facility_id,
                        drug_id=rec.drug_id,
                        batch_number=b_num,
                        quantity=b_qty,
                        expiry_date=b_exp_date,
                        is_verified=True
                    ))

        # Log TRANSFER_IN ledger
        ledger_entry = InventoryLedger(
            transaction_id=str(uuid.uuid4()),
            mutation_id=f"RECEIVE-{rec.id}",
            facility_id=rec.destination_facility_id,
            drug_id=rec.drug_id,
            batch_number=rec.dispatch_voucher_json["allocated_batches"][0]["batch_number"] if rec.dispatch_voucher_json.get("allocated_batches") else "MULTI",
            action_type="TRANSFER_IN",
            quantity=rec.quantity,
            vector_clock=1,
            client_id="phc-console",
            payload_hash=compute_payload_hash({"rec_id": rec.id, "action": "TRANSFER_IN"}),
            recipient_category="TRANSFER"
        )
        db.add(ledger_entry)

    rec.status = target_status
    if rejection_reason:
        rec.rejection_reason = rejection_reason
    if rejection_notes:
        rec.rejection_notes = rejection_notes

    # Create immutable audit log entry
    audit_payload = {
        "recommendation_id": rec.id,
        "from_status": current_status,
        "to_status": target_status,
        "actor": actor,
        "role": role,
        "quantity_before": qty_before,
        "quantity_after": qty_after,
        "rejection_reason": rejection_reason
    }

    audit_entry = AuditLog(
        event_id=f"EVT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}",
        actor=actor,
        role=role,
        scope=f"{source_fac.district} -> {dest_fac.district}",
        action=f"TRANSFER_{target_status}",
        recommendation_id=rec.id,
        from_status=current_status,
        to_status=target_status,
        quantity_before=qty_before,
        quantity_after=qty_after,
        reason=rejection_reason or f"Order transitioned to {target_status}",
        payload_hash=compute_payload_hash(audit_payload),
        metadata_json=audit_payload
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(rec)
    return rec
