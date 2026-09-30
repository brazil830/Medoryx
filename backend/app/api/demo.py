"""
Demo Scenario Control Panel Endpoints for ResilHealth-India.
Complies with Part AH and Part AT of Master Specification.
Enabled only in Demo mode (DEMO_MODE=true).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any

from app.core.database import get_db
from app.auth.rbac import decode_token
from app.models.models import DemoScenario, TransferRecommendation, AuditLog
from app.seed.seed_data import seed_database
from app.schemas.schemas import ScenarioTriggerRequest

router = APIRouter(prefix="/demo", tags=["Demo Environment Control"])

@router.get("/status")
def get_demo_scenario_status(db: Session = Depends(get_db)):
    scenario = db.query(DemoScenario).filter(DemoScenario.id == "default-scenario").first()
    if not scenario:
        return {
            "demo_mode": True,
            "active_scenario": "BASELINE",
            "outbreak_spike_active": False,
            "offline_mode_active": False
        }
    return {
        "demo_mode": True,
        "active_scenario": scenario.active_scenario,
        "outbreak_spike_active": scenario.outbreak_spike_active,
        "offline_mode_active": scenario.offline_mode_active,
        "fallback_vertex": scenario.fallback_vertex,
        "fallback_gemini": scenario.fallback_gemini,
        "server_vector_clock": scenario.server_vector_clock,
        "last_reset": scenario.last_reset_timestamp.isoformat()
    }

@router.post("/scenario")
def trigger_demo_scenario(
    req: ScenarioTriggerRequest,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(decode_token)
):
    if user.get("role") == "FEDERATION_ADMIN":
        raise HTTPException(
            status_code=403,
            detail={"error": {"code": "INSUFFICIENT_PERMISSION", "message": "FEDERATION_ADMIN cannot access Demo Controls."}}
        )

    scenario = db.query(DemoScenario).filter(DemoScenario.id == "default-scenario").first()
    if not scenario:
        scenario = DemoScenario(id="default-scenario")
        db.add(scenario)

    scenario.active_scenario = req.scenario or "MALARIA_SURGE"
    scenario.outbreak_spike_active = req.outbreak_spike_active if req.outbreak_spike_active is not None else True
    scenario.offline_mode_active = req.offline_mode if req.offline_mode is not None else False
    scenario.fallback_vertex = req.force_vertex_fallback or False
    scenario.fallback_gemini = req.force_gemini_fallback or False

    # Audit scenario trigger
    db.add(AuditLog(
        actor=user.get("name", "Demo Controller"),
        role=user.get("role", "DISTRICT_OFFICER"),
        scope="NATIONAL_DEMO",
        action="SCENARIO_TRIGGERED",
        reason=f"Demo scenario set to {scenario.active_scenario} (Outbreak={scenario.outbreak_spike_active})",
        payload_hash="demotriggersha256",
        metadata_json={
            "scenario": scenario.active_scenario,
            "outbreak_spike": scenario.outbreak_spike_active,
            "offline_mode": scenario.offline_mode_active
        }
    ))

    db.commit()
    return {
        "status": "SCENARIO_UPDATED",
        "active_scenario": scenario.active_scenario,
        "outbreak_spike_active": scenario.outbreak_spike_active,
        "offline_mode_active": scenario.offline_mode_active
    }

@router.post("/reset")
def reset_to_baseline(
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(decode_token)
):
    """
    Restores the database to clean baseline Seed 42 state.
    """
    seed_database(db)
    return {
        "status": "RESET_COMPLETE",
        "message": "Database and demo scenario restored to deterministic Seed 42 baseline."
    }
