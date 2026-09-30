"""
Main FastAPI Application Entrypoint for MedOryx-India.
Federated National Health Resource & Supply Chain Intelligence Platform.
Track: Smart Health & Supply Chain Resilience — BRICS Resilience Initiative.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import init_db, SessionLocal
from app.seed.seed_data import seed_database
from app.models.models import Facility

from app.api.auth import router as auth_router
from app.api.inventory import router as inventory_router
from app.api.optimization import router as optimization_router
from app.api.analytics import router as analytics_router
from app.api.federation import router as federation_router
from app.api.ai import router as ai_router
from app.api.audit import router as audit_router
from app.api.demo import router as demo_router
from app.api.health import router as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()
    # Check if database has seeded facilities, otherwise auto-seed
    with SessionLocal() as db:
        fac_count = db.query(Facility).count()
        if fac_count == 0:
            seed_database(db)
    yield

app = FastAPI(
    title="MedOryx-India Platform API",
    description="Federated National Health Resource & Supply Chain Intelligence Platform — Authoritative Backend",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(inventory_router)
app.include_router(optimization_router)
app.include_router(analytics_router)
app.include_router(federation_router)
app.include_router(ai_router)
app.include_router(audit_router)
app.include_router(demo_router)
app.include_router(health_router)

@app.get("/")
def read_root():
    return {
        "platform": "MedOryx-India",
        "title": "Federated National Health Resource & Supply Chain Intelligence Platform",
        "track": "Smart Health & Supply Chain Resilience — BRICS Resilience Initiative",
        "status": "OPERATIONAL_AUTHORITATIVE",
        "docs_url": "/docs",
        "seed": 42,
        "clock": "IST (Deterministic 2026-09-30)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
