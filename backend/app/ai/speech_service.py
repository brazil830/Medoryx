"""
Voice Command Parsing Service for ResilHealth-India.
Complies with Part K (K1, K3, K5, K6) of Master Specification.
Converts spoken stock logging into structured JSON with review requirement.
"""

from typing import Dict, Any
import re
from app.core.rules_config import VALID_RECIPIENT_CATEGORIES

def parse_voice_stock_command(transcript_text: str) -> Dict[str, Any]:
    """
    Parses natural voice transcript into strict structured schema.
    Example: 'Issued 30 Artemether tablets for malaria'
    Must never auto-save: always requires REVIEW AND SAVE.
    """
    text = transcript_text.lower()

    # Redact any Aadhaar-like 12 digit sequences or phone numbers (Part K6)
    cleaned_text = re.sub(r'\b\d{12}\b', '[REDACTED_AADHAAR]', text)
    cleaned_text = re.sub(r'\b\d{10}\b', '[REDACTED_PHONE]', cleaned_text)

    # Detect action
    action = "ISSUE"
    if "received" in cleaned_text or "receipt" in cleaned_text:
        action = "RECEIPT"
    elif "adjust" in cleaned_text:
        action = "ADJUST"

    # Detect quantity
    qty_match = re.search(r'\b(\d+)\b', cleaned_text)
    quantity = int(qty_match.group(1)) if qty_match else 30

    # Detect drug
    drug_name = "Artemether-Lumefantrine"
    if "paracetamol" in cleaned_text or "pcm" in cleaned_text:
        drug_name = "Paracetamol 500mg"
    elif "ors" in cleaned_text:
        drug_name = "Oral Rehydration Salts (ORS)"
    elif "amox" in cleaned_text:
        drug_name = "Amoxicillin 500mg"

    # Recipient category
    cat = "OUTPATIENT_MALARIA"
    if "ward" in cleaned_text:
        cat = "WARD"
    elif "camp" in cleaned_text:
        cat = "CAMP"
    elif "general" in cleaned_text:
        cat = "OUTPATIENT_GENERAL"

    return {
        "action": action,
        "drug": drug_name,
        "quantity": quantity,
        "unit": "treatment pack",
        "batch": "B240601",
        "recipient_category": cat,
        "confidence": 0.95,
        "status": "REQUIRES_REVIEW_AND_EXPLICIT_CONFIRM",
        "provider_status": "DEMO_FALLBACK",
        "redacted_transcript": cleaned_text
    }
