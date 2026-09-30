"""
SQLAlchemy ORM models for ResilHealth-India.
Complies with Part S of the Master Specification.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date, ForeignKey, Text, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    facility_type = Column(String(16), default="PHC")  # PHC, CHC, DH
    state = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    country_code = Column(String(8), default="IN")
    lead_time_days = Column(Integer, default=5)
    capacity_storage = Column(Integer, default=5000)
    footfall_daily = Column(Integer, default=120)

    batches = relationship("InventoryBatch", back_populates="facility")
    ledger_entries = relationship("InventoryLedger", back_populates="facility")

class Drug(Base):
    __tablename__ = "drug_catalog"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), default="Essential Anti-Malarial")
    unit = Column(String(32), default="pack")  # treatment pack, tablet, sachet
    pack_size = Column(Integer, default=10)  # P
    safety_days = Column(Integer, default=2)  # S
    min_shelf_life_days = Column(Integer, default=7)

    batches = relationship("InventoryBatch", back_populates="drug")

class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    facility_id = Column(String(64), ForeignKey("facilities.id"), nullable=False, index=True)
    drug_id = Column(String(64), ForeignKey("drug_catalog.id"), nullable=False, index=True)
    batch_number = Column(String(64), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    expiry_date = Column(Date, nullable=False, index=True)
    is_verified = Column(Boolean, default=True)  # False for UNKNOWN_BATCH
    created_at = Column(DateTime, default=datetime.utcnow)

    facility = relationship("Facility", back_populates="batches")
    drug = relationship("Drug", back_populates="batches")

class InventoryLedger(Base):
    __tablename__ = "inventory_ledger"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    transaction_id = Column(String(64), unique=True, default=generate_uuid, index=True)
    mutation_id = Column(String(128), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    facility_id = Column(String(64), ForeignKey("facilities.id"), nullable=False, index=True)
    drug_id = Column(String(64), ForeignKey("drug_catalog.id"), nullable=False, index=True)
    batch_number = Column(String(64), nullable=False)
    action_type = Column(String(32), nullable=False)  # ISSUE, RECEIPT, ADJUST, TRANSFER_OUT, TRANSFER_IN
    quantity = Column(Integer, nullable=False)
    vector_clock = Column(Integer, default=0)
    client_id = Column(String(64), default="offline-client")
    payload_hash = Column(String(128), nullable=False)
    recipient_category = Column(String(64), nullable=True)
    flags = Column(String(128), nullable=True)  # NEGATIVE_BALANCE, UNKNOWN_BATCH, EXPIRED_BATCH_ISSUE, CLOCK_SKEW

    facility = relationship("Facility", back_populates="ledger_entries")

class TransferRecommendation(Base):
    __tablename__ = "transfer_recommendations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    drug_id = Column(String(64), ForeignKey("drug_catalog.id"), nullable=False, index=True)
    source_facility_id = Column(String(64), ForeignKey("facilities.id"), nullable=False, index=True)
    destination_facility_id = Column(String(64), ForeignKey("facilities.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    original_quantity = Column(Integer, nullable=False)
    adjusted_quantity = Column(Integer, nullable=True)
    distance_km = Column(Float, nullable=False)
    transport_cost_inr = Column(Float, nullable=False)
    eta_hours = Column(Float, nullable=False)
    urgency = Column(String(32), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    source_coverage_days = Column(Float, default=0.0)
    destination_coverage_days = Column(Float, default=0.0)
    expiry_exposure_units = Column(Integer, default=0)
    model_source = Column(String(64), default="Local LightGBM")
    solver_status = Column(String(64), default="OPTIMAL_CBC")
    gemini_explanation = Column(Text, nullable=True)
    top_factors_json = Column(JSON, nullable=True)
    status = Column(String(32), default="PENDING", index=True)  # PENDING, APPROVED, REJECTED, DISPATCHED, COMPLETED, CANCELLED, EXPIRED
    rejection_reason = Column(String(64), nullable=True)
    rejection_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    voucher_id = Column(String(64), nullable=True)
    dispatch_voucher_json = Column(JSON, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    event_id = Column(String(64), unique=True, default=generate_uuid, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor = Column(String(128), nullable=False)
    role = Column(String(64), nullable=False)
    scope = Column(String(64), nullable=False)
    action = Column(String(64), nullable=False)
    recommendation_id = Column(String(64), nullable=True)
    from_status = Column(String(32), nullable=True)
    to_status = Column(String(32), nullable=True)
    quantity_before = Column(Integer, nullable=True)
    quantity_after = Column(Integer, nullable=True)
    reason = Column(String(128), nullable=True)
    payload_hash = Column(String(128), nullable=False)
    metadata_json = Column(JSON, nullable=True)

class FederatedRound(Base):
    __tablename__ = "federated_rounds"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    round_number = Column(Integer, unique=True, nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    local_epochs = Column(Integer, default=3)
    dp_noise = Column(Float, default=1.12)
    epsilon = Column(Float, default=2.15)
    delta = Column(Float, default=1e-5)
    global_loss = Column(Float, nullable=False)
    india_mae = Column(Float, nullable=False)
    brazil_mae = Column(Float, nullable=False)
    status = Column(String(32), default="COMPLETED")
    node_health_json = Column(JSON, nullable=True)

class FieldSignal(Base):
    __tablename__ = "field_signals"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    block_name = Column(String(64), nullable=False, index=True)
    signal_type = Column(String(64), nullable=False)  # stagnant_water, garbage_accumulation, etc.
    confidence = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    image_hash = Column(String(128), nullable=True)

class DemoScenario(Base):
    __tablename__ = "demo_scenarios"

    id = Column(String(64), primary_key=True, default="default-scenario")
    active_scenario = Column(String(64), default="BASELINE")
    outbreak_spike_active = Column(Boolean, default=False)
    offline_mode_active = Column(Boolean, default=False)
    fallback_vertex = Column(Boolean, default=False)
    fallback_gemini = Column(Boolean, default=False)
    server_vector_clock = Column(Integer, default=100)
    last_reset_timestamp = Column(DateTime, default=datetime.utcnow)
