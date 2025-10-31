# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel, ConfigDict
import logging, sys, inspect, time

# ====================================================
# LOGGING
# ====================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
    force=True,
)
logger = logging.getLogger("compliance_counsel")

# ====================================================
# INTERNAL IMPORTS
# ====================================================
from app.database import SessionLocal, engine, Base
from app import models
from app.auth.core import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.ingest.pdf_ingestor import run_ingestion
from app.ingest.pipeline_db import extract_all_new
from app.ingest.scheduler import start_scheduler, shutdown_scheduler, get_status

# Routers imported AFTER core setup
from app.api import acts, companies, compliances, assistant_ingest, assistant_ask
from app.api.extraction import router as extraction_router
from app.api import drafts 

# ====================================================
# DB INIT
# ====================================================
Base.metadata.create_all(bind=engine)

# ====================================================
# APP CONFIG
# ====================================================
app = FastAPI(
    title="Compliance Counsel API",
    version="1.0.0",
    description="End-to-end backend for Compliance Counsel — authentication, compliance tracking, PDF ingestion, and AI drafting.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ====================================================
# CORS
# ====================================================
origins = [
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:3001", "http://127.0.0.1:3001",
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://0.0.0.0:5173", "http://0.0.0.0:3001"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================================================
# DB DEPENDENCY
# ====================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ====================================================
# USER SCHEMAS
# ====================================================
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "USER"

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str

# ====================================================
# AUTH
# ====================================================
@app.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        name=user.name,
        email=user.email,
        role=user.role.upper(),
        password_hash=hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email}, expires_delta=timedelta(hours=2))
    return {"access_token": token, "token_type": "bearer"}

@app.get("/")
def root():
    return {"message": "✅ Compliance Counsel backend running with Swagger UI"}

# ====================================================
# COMPANIES
# ====================================================
@app.get("/companies")
def list_companies(page: int = 1, page_size: int = 20, q: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Company)
    if q:
        query = query.filter(models.Company.name.ilike(f"%{q}%"))
    total = query.count()
    items = query.order_by(models.Company.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [
            {
                "id": c.id, "name": c.name, "status": c.status,
                "industry_type": c.industry_type or c.industry,
                "authorized_capital": c.authorized_capital,
                "paid_up_capital": c.paid_up_capital,
                "address": c.address,
                "registration_date": c.registration_date,
                "director_name": c.director_name,
                "director_email": c.director_email,
                "company_secretary": c.company_secretary,
                "auditor_name": c.auditor_name,
                "notes": c.notes,
            } for c in items
        ],
        "page": page, "page_size": page_size, "total": total,
        "has_next": (page * page_size) < total,
    }

# ====================================================
# INGESTION + SCHEDULER
# ====================================================
@app.on_event("startup")
def startup_ingestion():
    """Auto-ingest compliances only when DB is ready."""
    time.sleep(5)
    db = SessionLocal()
    try:
        logger.info("🔄 Starting initial ingestion...")
        result = extract_all_new(db)
        db.commit()
        logger.info(f"✅ Initial ingestion complete: {result.get('processed_files', 0)} files processed.")
    except Exception as e:
        logger.error(f"❌ Startup ingestion failed: {e}")
    finally:
        db.close()
    start_scheduler()
    logger.info("🕒 Scheduler started (3 AM daily).")

@app.on_event("shutdown")
def stop_schedule():
    shutdown_scheduler()
    logger.info("🛑 Scheduler stopped.")

@app.post("/extract/run")
def manual_extract(db: Session = Depends(get_db)):
    result = extract_all_new(db)
    db.commit()
    return result

# ====================================================
# ROUTERS
# ====================================================
app.include_router(acts.router)
app.include_router(companies.router)
app.include_router(compliances.router)
app.include_router(assistant_ingest.router)
app.include_router(assistant_ask.router)
app.include_router(extraction_router)
app.include_router(drafts.router)
