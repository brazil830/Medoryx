import logging
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from app.models.models import Base

logger = logging.getLogger("uvicorn.error")

def get_default_sqlite_url() -> str:
    # Anchor to the backend directory or project root where medoryx.db lives
    backend_dir = Path(__file__).resolve().parent.parent.parent
    candidate_backend = backend_dir / "medoryx.db"
    candidate_root = backend_dir.parent / "medoryx.db"
    if candidate_backend.exists():
        return f"sqlite:///{candidate_backend.as_posix()}"
    elif candidate_root.exists():
        return f"sqlite:///{candidate_root.as_posix()}"
    return f"sqlite:///{candidate_backend.as_posix()}"

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = get_default_sqlite_url()
elif DATABASE_URL.startswith("sqlite:///."):
    rel_path = DATABASE_URL.replace("sqlite:///", "")
    resolved_path = Path(rel_path).resolve()
    if not resolved_path.exists():
        backend_dir = Path(__file__).resolve().parent.parent.parent
        if (backend_dir / "medoryx.db").exists():
            resolved_path = backend_dir / "medoryx.db"
        elif (backend_dir.parent / "medoryx.db").exists():
            resolved_path = backend_dir.parent / "medoryx.db"
    DATABASE_URL = f"sqlite:///{resolved_path.as_posix()}"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    global engine, SessionLocal, DATABASE_URL
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as exc:
        if not DATABASE_URL.startswith("sqlite"):
            fallback_url = get_default_sqlite_url()
            logger.warning(
                f"[DATABASE WARNING] Primary database connection failed ({exc.orig if hasattr(exc, 'orig') else exc}). "
                f"Falling back to local SQLite database ({fallback_url}) for zero-config development."
            )
            DATABASE_URL = fallback_url
            engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
            SessionLocal.configure(bind=engine)
            Base.metadata.create_all(bind=engine)
        else:
            raise

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

