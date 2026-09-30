"""
Audit Trail & Forensic Log Endpoints for MedOryx-India.
Complies with Part AC & Part E7 of Master Specification.
"""

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import io
import csv

from app.core.database import get_db
from app.auth.rbac import decode_token
from app.models.models import AuditLog

router = APIRouter(prefix="/audit", tags=["Audit & Governance"])

@router.get("/logs")
def get_audit_logs(
    role: Optional[str] = None,
    action: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(decode_token)
):
    query = db.query(AuditLog)
    if role:
        query = query.filter(AuditLog.role == role)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if search:
        query = query.filter(
            (AuditLog.event_id.ilike(f"%{search}%")) |
            (AuditLog.actor.ilike(f"%{search}%")) |
            (AuditLog.reason.ilike(f"%{search}%"))
        )

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    return {
        "total_records": len(logs),
        "logs": [
            {
                "id": l.id,
                "event_id": l.event_id,
                "timestamp": l.timestamp.isoformat(),
                "actor": l.actor,
                "role": l.role,
                "scope": l.scope,
                "action": l.action,
                "recommendation_id": l.recommendation_id,
                "from_status": l.from_status,
                "to_status": l.to_status,
                "quantity_before": l.quantity_before,
                "quantity_after": l.quantity_after,
                "reason": l.reason,
                "payload_hash": l.payload_hash,
                "metadata": l.metadata_json
            }
            for l in logs
        ]
    }

@router.get("/export-csv")
def export_audit_csv(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Event ID", "Timestamp (UTC)", "Actor", "Role", "Scope",
        "Action", "Recommendation ID", "From Status", "To Status",
        "Quantity Before", "Quantity After", "Reason", "Payload SHA256 Hash"
    ])

    for l in logs:
        writer.writerow([
            l.event_id, l.timestamp.isoformat(), l.actor, l.role, l.scope,
            l.action, l.recommendation_id or "", l.from_status or "", l.to_status or "",
            l.quantity_before or "", l.quantity_after or "", l.reason or "", l.payload_hash
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=medoryx_audit_log.csv"}
    )
