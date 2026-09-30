"""
Authentication Endpoints for ResilHealth-India.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.auth.rbac import PREAPPROVED_ACCOUNTS, decode_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(account_key: str = "dmo_kanchipuram") -> Dict[str, Any]:
    if account_key in PREAPPROVED_ACCOUNTS:
        acc = PREAPPROVED_ACCOUNTS[account_key]
        return {
            "token": account_key,
            "user": acc,
            "message": f"Logged in as {acc['name']} ({acc['role']})"
        }
    # Default to DMO
    return {
        "token": "dmo_kanchipuram",
        "user": PREAPPROVED_ACCOUNTS["dmo_kanchipuram"],
        "message": "Logged in as default DMO"
    }

@router.get("/me")
def get_current_user_profile(user: Dict[str, Any] = Depends(decode_token)) -> Dict[str, Any]:
    return {"user": user}
