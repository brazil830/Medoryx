"""
Offline Synchronization & Vector Clock Engine for ResilHealth-India.
Complies with Part J8 of the Master Specification.
"""

from datetime import datetime, timezone, timedelta, date
import hashlib
import json
import uuid
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models.models import InventoryBatch, InventoryLedger, AuditLog, DemoScenario
from app.core.rules_config import get_current_date, VALID_RECIPIENT_CATEGORIES

def compute_hash(payload: Any) -> str:
    serialized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def process_sync_batch(
    db: Session,
    facility_id: str,
    client_id: str,
    last_sync_vector_clock: int,
    mutations: List[Dict[str, Any]],
    actor: str = "PHC_OPERATOR",
    role: str = "PHC_OPERATOR"
) -> Dict[str, Any]:
    """
    Applies incoming mutations idempotently, using vector clocks and ledger replay.
    """
    scenario = db.query(DemoScenario).filter(DemoScenario.id == "default-scenario").first()
    if not scenario:
        server_clock = 100
    else:
        server_clock = scenario.server_vector_clock

    processed_ids = []
    conflicts = []
    current_date = get_current_date()

    # Sort mutations by client vector clock ascending
    sorted_mutations = sorted(mutations, key=lambda m: m.get("vector_clock", 0))

    for mut in sorted_mutations:
        m_id = mut["mutation_id"]
        payload = mut.get("payload", {})
        client_clock = mut.get("vector_clock", 0)
        curr_hash = compute_hash(payload)

        # Check existing mutation in ledger
        existing = db.query(InventoryLedger).filter(InventoryLedger.mutation_id == m_id).first()
        if existing:
            if existing.payload_hash == curr_hash:
                # Idempotent DUPLICATE
                processed_ids.append({"mutation_id": m_id, "status": "DUPLICATE"})
                continue
            else:
                # HASH_MISMATCH
                conflicts.append({
                    "mutation_id": m_id,
                    "status": "HASH_MISMATCH",
                    "reason": "Payload hash mismatch with previously recorded mutation."
                })
                continue

        # Validate action
        action_type = payload.get("action", payload.get("action_type", "ISSUE")).upper()
        drug_id = payload.get("drug_id", "DRUG-AL-01")
        batch_number = payload.get("batch_number", "UNKNOWN")
        quantity = int(payload.get("quantity", payload.get("quantity_issued", 0)))
        recipient_cat = payload.get("recipient_category", "OUTPATIENT_GENERAL")

        flags = []

        # Check clock skew (> 5 minutes future)
        raw_ts = mut.get("timestamp")
        if raw_ts:
            try:
                dt_ts = datetime.fromisoformat(raw_ts.replace("Z", "+00:00")).replace(tzinfo=None)
                if dt_ts > datetime.utcnow() + timedelta(minutes=5):
                    flags.append("CLOCK_SKEW")
            except Exception:
                pass

        # Locate or create batch
        batch = db.query(InventoryBatch).filter(
            InventoryBatch.facility_id == facility_id,
            InventoryBatch.drug_id == drug_id,
            InventoryBatch.batch_number == batch_number
        ).first()

        if not batch:
            flags.append("UNKNOWN_BATCH")
            # Create unverified batch
            batch = InventoryBatch(
                facility_id=facility_id,
                drug_id=drug_id,
                batch_number=batch_number,
                quantity=0,
                expiry_date=current_date + timedelta(days=90),
                is_verified=False
            )
            db.add(batch)
            db.flush()

        # Check expired batch issue
        if action_type == "ISSUE":
            if batch.expiry_date < current_date:
                flags.append("EXPIRED_BATCH_ISSUE")

            # Check negative balance
            if batch.quantity < quantity:
                flags.append("NEGATIVE_BALANCE")
                batch.quantity = 0  # Floor = 0
            else:
                batch.quantity -= quantity

        elif action_type == "RECEIPT":
            batch.quantity += quantity
        elif action_type == "ADJUST":
            batch.quantity = max(0, quantity)

        # Increment server clock: max(server_clock, client_clock) + 1
        server_clock = max(server_clock, client_clock) + 1

        ledger_entry = InventoryLedger(
            transaction_id=str(uuid.uuid4()),
            mutation_id=m_id,
            facility_id=facility_id,
            drug_id=drug_id,
            batch_number=batch_number,
            action_type=action_type,
            quantity=quantity,
            vector_clock=server_clock,
            client_id=client_id,
            payload_hash=curr_hash,
            recipient_category=recipient_cat,
            flags=",".join(flags) if flags else None
        )
        db.add(ledger_entry)

        # Audit if critical flags present
        if flags:
            db.add(AuditLog(
                actor=actor,
                role=role,
                scope=f"FACILITY:{facility_id}",
                action=f"SYNC_ANOMALY_{action_type}",
                reason=f"Offline sync flagged: {','.join(flags)}",
                payload_hash=curr_hash,
                metadata_json={"mutation_id": m_id, "flags": flags, "quantity": quantity}
            ))

        processed_ids.append({"mutation_id": m_id, "status": "APPLIED", "flags": flags})

    # Update scenario vector clock
    if scenario:
        scenario.server_vector_clock = server_clock
    db.commit()

    # Query current balances
    batches = db.query(InventoryBatch).filter(
        InventoryBatch.facility_id == facility_id,
        InventoryBatch.quantity > 0
    ).all()

    current_balances = [
        {
            "drug_id": b.drug_id,
            "batch_number": b.batch_number,
            "usable_stock": b.quantity,
            "expiry_date": b.expiry_date.isoformat(),
            "is_verified": b.is_verified
        }
        for b in batches
    ]

    return {
        "status": "SUCCESS" if not conflicts else "PARTIAL_SUCCESS",
        "server_vector_clock": server_clock,
        "processed_mutations": processed_ids,
        "conflicts": conflicts,
        "current_balances": current_balances
    }
