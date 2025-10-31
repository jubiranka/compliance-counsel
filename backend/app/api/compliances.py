# app/api/compliances.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
import datetime
from app.ingest.pipeline import run_pipeline

router = APIRouter(prefix="/compliances", tags=["Compliances"])

# ---------------------------------------------------------
# 1️⃣ List compliances (Paginated) — auto fallback to mock data if DB empty
# ---------------------------------------------------------
@router.get("/", summary="List compliances (paginated)")
def list_compliances(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.Compliance)
    total = query.count()

    # 🧩 Fallback: if DB empty → use sample compliances
    if total == 0:
        sample_data = [
            {
                "id": 1,
                "company_id": 1,
                "name": "Annual Return Filing",
                "type": "routine",
                "due_date": "2025-07-31",
                "status": "pending",
                "form_no": "MGT-7 / MGT-7A",
                "section_ref": "Section 92, Companies Act 2013",
                "penalty": "₹100 per day of delay as per Rule 11 of Companies (Management & Administration) Rules, 2014",
                "notes": "File within 60 days of AGM using MGT-7 for large companies and MGT-7A for OPCs and Small Companies.",
            },
            {
                "id": 2,
                "company_id": 1,
                "name": "Board Meeting Minutes",
                "type": "routine",
                "due_date": "2025-08-15",
                "status": "completed",
                "form_no": "NA",
                "section_ref": "Section 173 & SS-1",
                "penalty": "—",
                "notes": "Minutes must be recorded and signed within 30 days of the Board Meeting as per Secretarial Standard-1.",
            },
            {
                "id": 3,
                "company_id": 1,
                "name": "Auditor Appointment",
                "type": "routine",
                "due_date": "2025-09-30",
                "status": "pending",
                "form_no": "ADT-1",
                "section_ref": "Section 139(1)",
                "penalty": "₹50,000 or higher depending on default as per Section 147",
                "notes": "File Form ADT-1 within 15 days of AGM for appointment/re-appointment of auditor.",
            },
        ]
        return {
            "page": page,
            "page_size": page_size,
            "total": len(sample_data),
            "has_next": False,
            "items": sample_data,
        }

    # 🧠 If DB has data → show live records
    items = (
        query.order_by(models.Compliance.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "has_next": (page * page_size) < total,
        "items": [
            {
                "id": c.id,
                "company_id": c.company_id,
                "act_id": c.act_id,
                "section_id": c.section_id,
                "rule_id": c.rule_id,
                "form_id": c.form_id,
                "status": c.status.value if c.status else None,
                "due_date": c.due_date.isoformat() if c.due_date else None,
                "verified_status": getattr(c, "verified_status", None),
                "verified_at": c.verified_at.isoformat() if c.verified_at else None,
                "remarks": getattr(c, "remarks", None),
                "verified_by": getattr(c, "verified_by", None),
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            }
            for c in items
        ],
    }

# Mirror route for no-slash version
@router.get("", include_in_schema=False)
def list_compliances_no_slash(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return list_compliances(page=page, page_size=page_size, db=db)

# ---------------------------------------------------------
# 2️⃣ Add new compliance
# ---------------------------------------------------------
@router.post("/", summary="Add new compliance")
def create_compliance(payload: dict, db: Session = Depends(get_db)):
    try:
        c = models.Compliance(
            company_id=payload.get("company_id"),
            act_id=payload.get("act_id"),
            section_id=payload.get("section_id"),
            rule_id=payload.get("rule_id"),
            form_id=payload.get("form_id"),
            status=payload.get("status", models.ComplianceStatus.PENDING),
            due_date=payload.get("due_date"),
            verified_status=payload.get("verified_status"),
            verified_at=payload.get("verified_at"),
            remarks=payload.get("remarks"),
            verified_by=payload.get("verified_by"),
        )
        db.add(c)
        db.commit()
        db.refresh(c)
        return {"status": "created", "id": c.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating compliance: {str(e)}")

@router.post("", include_in_schema=False)
def create_compliance_no_slash(payload: dict, db: Session = Depends(get_db)):
    return create_compliance(payload=payload, db=db)

# ---------------------------------------------------------
# 3️⃣ Update compliance
# ---------------------------------------------------------
@router.put("/{compliance_id}", summary="Update compliance")
def update_compliance(compliance_id: int, payload: dict, db: Session = Depends(get_db)):
    c = db.query(models.Compliance).get(compliance_id)
    if not c:
        raise HTTPException(status_code=404, detail="Compliance not found")
    for key, value in payload.items():
        if hasattr(c, key):
            setattr(c, key, value)
    db.commit()
    db.refresh(c)
    return {"status": "updated", "id": c.id}

# ---------------------------------------------------------
# 4️⃣ Delete compliance
# ---------------------------------------------------------
@router.delete("/{compliance_id}", summary="Delete compliance")
def delete_compliance(compliance_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Compliance).get(compliance_id)
    if not c:
        raise HTTPException(status_code=404, detail="Compliance not found")
    db.delete(c)
    db.commit()
    return {"status": "deleted", "id": compliance_id}

# ---------------------------------------------------------
# 5️⃣ Stats (uses DB or fallback)
# ---------------------------------------------------------
@router.get("/stats", summary="Compliance summary stats")
def compliance_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(models.Compliance.id)).scalar() or 0
    if total == 0:
        return {
            "total": 3,
            "pending": 2,
            "completed": 1,
            "overdue": 0,
            "upcoming_30d": 1,
        }

    by_status = dict(
        db.query(models.Compliance.status, func.count(models.Compliance.id))
        .group_by(models.Compliance.status)
    )
    today = datetime.date.today()
    in_30 = today + datetime.timedelta(days=30)
    upcoming = (
        db.query(func.count(models.Compliance.id))
        .filter(
            models.Compliance.due_date != None,
            models.Compliance.due_date <= in_30,
            models.Compliance.status != models.ComplianceStatus.COMPLETED,
        )
        .scalar()
        or 0
    )
    return {
        "total": total,
        "pending": by_status.get(models.ComplianceStatus.PENDING, 0),
        "completed": by_status.get(models.ComplianceStatus.COMPLETED, 0),
        "overdue": by_status.get(models.ComplianceStatus.OVERDUE, 0),
        "upcoming_30d": upcoming,
    }

# ---------------------------------------------------------
# 6️⃣ Draft Generation — keep dynamic AI intact
# ---------------------------------------------------------
@router.post("/generate-draft", summary="Generate AI Compliance Draft")
def generate_draft(
    user_input: str = Query(..., description="Compliance ID or keyword"),
):
    dataset_path = "/app/app/data/compliances_MASTER.json"
    try:
        result = run_pipeline(user_input=user_input, dataset_path=dataset_path)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Draft generation failed: {str(e)}")
