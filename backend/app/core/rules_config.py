"""
Authoritative Rules Configuration for ResilHealth-India Platform.
Complies with Part J of the Master Build Specification.
"""

from datetime import date, datetime
from typing import Dict

# Deterministic Clock Setting (Part AM)
DEMO_DETERMINISTIC: bool = True
DEMO_DATE_STR: str = "2026-09-30"
DEMO_DATE: date = date(2026, 9, 30)

def get_current_date() -> date:
    """Return deterministic date if enabled, otherwise current date in IST."""
    if DEMO_DETERMINISTIC:
        return DEMO_DATE
    return datetime.now().date()

# J0 Definitions
MIN_SHELF_LIFE_DAYS: int = 7  # Batches expiring sooner are excluded from usable stock
FEFO_MIN_DAYS_AT_ARRIVAL: int = 30  # Batch must have >= 30 days remaining upon expected arrival
DEFAULT_LEAD_TIME_DAYS: int = 5  # L

# Safety Days S: AL = 2, other seeded drugs = 7, default override = 15
SAFETY_DAYS_BY_DRUG: Dict[str, int] = {
    "DRUG-AL-01": 2,
    "AL": 2,
    "DRUG-PCM-01": 7,
    "DRUG-ORS-01": 7,
    "DRUG-AMO-01": 7,
    "DRUG-AZI-01": 7,
    "DRUG-CIP-01": 7,
}
DEFAULT_SAFETY_DAYS: int = 15

# Standard Pack size P: AL = 10
PACK_SIZE_BY_DRUG: Dict[str, int] = {
    "DRUG-AL-01": 10,
    "AL": 10,
    "DRUG-PCM-01": 20,
    "DRUG-ORS-01": 25,
    "DRUG-AMO-01": 10,
    "DRUG-AZI-01": 6,
    "DRUG-CIP-01": 10,
}
DEFAULT_PACK_SIZE: int = 10

def get_lead_time(drug_id: str = "") -> int:
    return DEFAULT_LEAD_TIME_DAYS

def get_safety_days(drug_id: str) -> int:
    return SAFETY_DAYS_BY_DRUG.get(drug_id, DEFAULT_SAFETY_DAYS)

def get_horizon_T(drug_id: str) -> int:
    """T = L + S"""
    return get_lead_time(drug_id) + get_safety_days(drug_id)

def get_pack_size(drug_id: str) -> int:
    """P: transfer standard pack size"""
    return PACK_SIZE_BY_DRUG.get(drug_id, DEFAULT_PACK_SIZE)

# J3 Status Thresholds
STATUS_RED_P_THRESHOLD: float = 0.70
STATUS_AMBER_P_THRESHOLD: float = 0.30

# J4 Urgency Thresholds
URGENCY_CRITICAL_P_THRESHOLD: float = 0.90
URGENCY_HIGH_P_THRESHOLD: float = 0.70
URGENCY_MEDIUM_P_THRESHOLD: float = 0.30

# J6 MILP & Cost Parameters
MILP_MAX_ROAD_DISTANCE_KM: float = 40.0
MILP_COST_FIXED_INR: float = 100.0
MILP_COST_PER_KM_INR: float = 15.0
DISPATCH_LAG_HOURS: float = 12.0
TRANSPORT_SPEED_KMH: float = 30.0

# J9 Expiry SLA hours
SLA_EXPIRY_HOURS = {
    "CRITICAL": 6,
    "HIGH": 24,
    "MEDIUM": 72,
    "LOW": 72
}

# J9 Rejection Reasons
VALID_REJECTION_REASONS = [
    "INSUFFICIENT_TRANSPORT",
    "SOURCE_NEEDS_STOCK",
    "DATA_DOUBTFUL",
    "ALTERNATE_SUPPLY_ARRANGED",
    "CLINICAL_PRIORITY_OTHER",
    "OTHER"
]

# K5 Recipient Categories
VALID_RECIPIENT_CATEGORIES = [
    "OUTPATIENT_MALARIA",
    "OUTPATIENT_GENERAL",
    "WARD",
    "CAMP"
]

# Anomaly Detection (Part M)
ANOMALY_CONTAMINATION: float = 0.02

# Federated Learning (Part N)
FEDERATION_MAX_EPSILON: float = 3.0
FEDERATION_DELTA: float = 1e-5
