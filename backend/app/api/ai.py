"""
Google AI Services API Router for ResilHealth-India.
Complies with Part K, Part L, and Part Z of Master Specification.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.core.database import get_db
from app.auth.rbac import decode_token
from app.schemas.schemas import ExplainRequest, CopilotRequest
from app.ai.gemini_service import explain_recommendation, query_copilot
from app.ai.vision_service import analyze_medicine_image, analyze_outbreak_photo
from app.ai.speech_service import parse_voice_stock_command
from app.ai.translation_service import translate_text

router = APIRouter(prefix="/ai", tags=["AI Engine"])

@router.post("/explain")
def get_recommendation_explanation(req: ExplainRequest):
    return explain_recommendation(
        source_name=req.source_name,
        dest_name=req.dest_name,
        drug_name=req.drug_name,
        quantity=req.quantity,
        distance_km=req.distance_km,
        eta_hours=req.eta_hours,
        cost_inr=req.cost_inr,
        days_remaining=req.days_remaining,
        p_stockout=req.p_stockout,
        source_at_risk_qty=req.source_at_risk_qty
    )

@router.post("/copilot")
def ask_copilot(
    req: CopilotRequest,
    db: Session = Depends(get_db),
    user: Dict[str, Any] = Depends(decode_token)
):
    return query_copilot(
        query_text=req.query,
        db=db,
        user_role=user.get("role", "DISTRICT_OFFICER"),
        user_district=user.get("district", "Kanchipuram"),
        language=req.language or "en"
    )

@router.post("/vision/extract")
def extract_medicine_details(
    file: Optional[UploadFile] = File(None),
    filename: Optional[str] = Form("medicine_box.jpg")
):
    # Process strictly in memory, never persist patient images
    return analyze_medicine_image(filename=filename or "medicine_box.jpg")

@router.post("/vision/outbreak-photo")
def extract_outbreak_photo(
    block_name: str = Form("Anakaputhur Block"),
    latitude: float = Form(12.9738),
    longitude: float = Form(80.1215)
):
    return analyze_outbreak_photo(block_name=block_name, latitude=latitude, longitude=longitude)

@router.post("/voice/parse")
def parse_voice(transcript: str = Form("Issued 30 Artemether tablets for malaria")):
    return parse_voice_stock_command(transcript)

@router.post("/translate")
def translate(text: str = Form(...), target_lang: str = Form("ta")):
    return translate_text(text, target_lang)
