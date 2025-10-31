# app/api/acts.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database import SessionLocal
from app import models

router = APIRouter(prefix="/acts", tags=["Acts"])

# Local DB dependency (keeps this router self-contained)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def paginate(query, page: int, page_size: int):
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "has_next": (page * page_size) < total,
    }

def act_to_dict(act: models.Act, counts: Optional[Dict[str, int]] = None) -> Dict[str, Any]:
    return {
        "id": act.id,
        "name": act.name,
        "description": act.description,
        "source_uri": getattr(act, "source_uri", None),
        "source_hash": getattr(act, "source_hash", None),
        "parser_version": getattr(act, "parser_version", None),
        "extracted_at": getattr(act, "extracted_at", None),
        "created_at": getattr(act, "created_at", None),
        "updated_at": getattr(act, "updated_at", None),
        "stats": counts or {},
    }

def section_to_dict(section: models.Section) -> Dict[str, Any]:
    return {
        "id": section.id,
        "section_number": section.section_number,
        "description": section.description,
        "act_id": section.act_id,
        "version": getattr(section, "version", None),
        "is_current": getattr(section, "is_current", None),
        "effective_date": getattr(section, "effective_date", None),
        "amended_date": getattr(section, "amended_date", None),
        "repealed": getattr(section, "repealed", None),
        "verified_status": getattr(section, "verified_status", None),
        "verified_by": getattr(section, "verified_by", None),
        "verified_at": getattr(section, "verified_at", None),
    }

@router.get("", summary="List Acts with pagination and optional search")
def list_acts(
    q: Optional[str] = Query(None, description="Search by act name or description"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(models.Act)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(models.Act.name.ilike(like),
                                 models.Act.description.ilike(like)))
    # Paginate
    payload = paginate(query.order_by(models.Act.id.asc()), page, page_size)

    # Precompute counts for returned act ids
    act_ids = [a.id for a in payload["items"]]
    counts_by_act = {aid: {"sections": 0, "compliances": 0} for aid in act_ids}
    if act_ids:
        sec_counts = (
            db.query(models.Section.act_id, func.count(models.Section.id))
              .filter(models.Section.act_id.in_(act_ids))
              .group_by(models.Section.act_id)
              .all()
        )
        for act_id, cnt in sec_counts:
            counts_by_act[act_id]["sections"] = cnt

        comp_counts = (
            db.query(models.Compliance.act_id, func.count(models.Compliance.id))
              .filter(models.Compliance.act_id.in_(act_ids))
              .group_by(models.Compliance.act_id)
              .all()
        )
        for act_id, cnt in comp_counts:
            counts_by_act[act_id]["compliances"] = cnt

    payload["items"] = [act_to_dict(a, counts_by_act.get(a.id)) for a in payload["items"]]
    return payload

@router.get("/{act_id}", summary="Get Act by ID with stats")
def get_act(
    act_id: int,
    db: Session = Depends(get_db),
):
    act = db.query(models.Act).filter(models.Act.id == act_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Act not found")

    # Stats
    sections_count = db.query(func.count(models.Section.id)).filter(models.Section.act_id == act_id).scalar()
    compliances_count = db.query(func.count(models.Compliance.id)).filter(models.Compliance.act_id == act_id).scalar()

    return act_to_dict(
        act,
        counts={
            "sections": int(sections_count or 0),
            "compliances": int(compliances_count or 0),
        },
    )

@router.get("/{act_id}/sections", summary="List Sections for an Act")
def list_sections_for_act(
    act_id: int,
    q: Optional[str] = Query(None, description="Search by section_number or description"),
    is_current: Optional[bool] = Query(None, description="Filter by current sections"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    # ensure act exists (keeps UX predictable)
    exists = db.query(models.Act.id).filter(models.Act.id == act_id).first()
    if not exists:
        raise HTTPException(status_code=404, detail="Act not found")

    query = db.query(models.Section).filter(models.Section.act_id == act_id)

    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(models.Section.section_number.ilike(like),
                models.Section.description.ilike(like))
        )

    if is_current is not None and hasattr(models.Section, "is_current"):
        query = query.filter(models.Section.is_current == is_current)

    payload = paginate(query.order_by(models.Section.id.asc()), page, page_size)
    payload["items"] = [section_to_dict(s) for s in payload["items"]]
    return payload
