"""
Federated Learning API Router for ResilHealth-India.
Complies with Part N of Master Specification.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.federation.federation_service import get_federation_status, execute_federated_round

router = APIRouter(prefix="/federation", tags=["Federation"])

@router.get("/global-model")
def get_global_model_status(db: Session = Depends(get_db)):
    return get_federation_status(db)

@router.post("/run-round")
def run_round(db: Session = Depends(get_db)):
    return execute_federated_round(db)
