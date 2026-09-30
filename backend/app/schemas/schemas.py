"""
Pydantic Schemas for ResilHealth-India API.
Complies with Part Q and R of Master Specification.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, date

class MutationPayload(BaseModel):
    drug_id: str
    batch_number: str
    action_type: str = "ISSUE"
    quantity: int
    recipient_category: Optional[str] = "OUTPATIENT_GENERAL"

class MutationItem(BaseModel):
    mutation_id: str
    timestamp: Optional[str] = None
    entity_type: str = "INVENTORY_LEDGER"
    payload: MutationPayload
    vector_clock: int = 0

class SyncRequest(BaseModel):
    client_id: str
    last_sync_vector_clock: int = 0
    mutations: List[MutationItem]

class SyncResponse(BaseModel):
    status: str
    server_vector_clock: int
    processed_mutations: List[Dict[str, Any]]
    conflicts: List[Dict[str, Any]]
    current_balances: List[Dict[str, Any]]

class ApproveTransferRequest(BaseModel):
    adjusted_quantity: Optional[int] = None

class RejectTransferRequest(BaseModel):
    rejection_reason: str
    rejection_notes: Optional[str] = None

class ExplainRequest(BaseModel):
    recommendation_id: Optional[str] = None
    source_name: Optional[str] = "PHC Chromepet"
    dest_name: Optional[str] = "PHC Anakaputhur"
    drug_name: Optional[str] = "Artemether-Lumefantrine"
    quantity: Optional[int] = 120
    distance_km: Optional[float] = 12.0
    eta_hours: Optional[float] = 12.4
    cost_inr: Optional[float] = 280.0
    days_remaining: Optional[float] = 4.1
    p_stockout: Optional[float] = 0.99
    source_at_risk_qty: Optional[int] = 20

class CopilotRequest(BaseModel):
    query: str
    language: Optional[str] = "en"

class AnomalyCheckRequest(BaseModel):
    facility_id: str
    drug_id: str
    issue_quantity: int
    is_weekend: Optional[bool] = False
    footfall: Optional[int] = 120

class ScenarioTriggerRequest(BaseModel):
    scenario: Optional[str] = "MALARIA_SURGE"
    outbreak_spike_active: Optional[bool] = True
    offline_mode: Optional[bool] = False
    force_vertex_fallback: Optional[bool] = False
    force_gemini_fallback: Optional[bool] = False
