from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from datetime import datetime, date

router = APIRouter(prefix="/companies", tags=["Companies"])

# -----------------------------------------------------
# 🧠 Database session
# -----------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------------------------------
# 📦 Pydantic Schemas
# -----------------------------------------------------
class CompanyOut(BaseModel):
    id: int
    name: str
    status: Optional[str] = None
    cin_number: Optional[str] = None
    industry_type: Optional[str] = None
    authorized_capital: Optional[float] = None
    paid_up_capital: Optional[float] = None
    address: Optional[str] = None
    registration_date: Optional[date] = None
    director_name: Optional[str] = None
    director_email: Optional[str] = None
    company_secretary: Optional[str] = None
    auditor_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class PaginatedCompanies(BaseModel):
    items: List[CompanyOut]
    page: int
    page_size: int
    total: int
    has_next: bool


# -----------------------------------------------------
# 📋 GET /companies — list all companies
# -----------------------------------------------------
@router.get("", response_model=PaginatedCompanies)
def list_companies(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = Query(None, description="Optional search by name or CIN"),
):
    query = db.query(models.Company)

    if q:
        q = q.strip()
        query = query.filter(
            (models.Company.name.ilike(f"%{q}%"))
            | (models.Company.cin_number.ilike(f"%{q}%"))
        )

    total = query.count()
    items = (
        query.order_by(models.Company.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "has_next": (page * page_size) < total,
    }


# -----------------------------------------------------
# 🏗️ POST /companies — create a new company
# -----------------------------------------------------
class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    cin_number: Optional[str] = None
    industry_type: Optional[str] = None
    status: Optional[str] = None
    authorized_capital: Optional[float] = None
    paid_up_capital: Optional[float] = None
    address: Optional[str] = None
    registration_date: Optional[date] = None
    director_name: Optional[str] = None
    director_email: Optional[str] = None
    company_secretary: Optional[str] = None
    auditor_name: Optional[str] = None
    notes: Optional[str] = None


@router.post("", response_model=CompanyOut, status_code=201)
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Company).filter(models.Company.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company with this name already exists")

    company = models.Company(**payload.dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company
