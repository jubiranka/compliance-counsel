"""
Extraction & Ingestion API
--------------------------
Includes:
1️⃣ /companies/{company_id}/extracted-compliances  →  mock demo data
2️⃣ /extract/run  →  auto-ingests all PDFs from /app/app/data/**
3️⃣ /extract/pdf  →  manual upload via API (single PDF)
"""

from fastapi import APIRouter, Query, UploadFile, File, HTTPException, Depends
from datetime import datetime
from sqlalchemy.orm import Session
from pathlib import Path
import re

# --- Local imports
from app.database import get_db
from app.ingest.extractor import extract_from_pdf_file
from app.ingest.db_loader import persist_extraction_bundle

router = APIRouter(tags=["Extraction"])

# ---------------------------
#  PART 1️⃣: STATIC SAMPLE ENDPOINT (for demo/testing)
# ---------------------------

def load_compliances():
    return [
        {
            "id": "CA2013_s92_4",
            "act": "Companies Act, 2013",
            "source_category": "Corporate",
            "section_ref": "Section 92(4)",
            "name": "Annual Return Filing",
            "type": "Annual",
            "due_date": "within sixty days from the date on which the annual general meeting is held",
            "form_no": "MGT-7",
            "penalty": "Company liable to a penalty of ₹10,000 and ₹100/day (max. ₹2 lakh).",
            "responsible_entity": "Company, Officer in default",
            "status": "Required",
            "notes": "To be signed by a director and the Company Secretary/CS in practice.",
        },
    ]

def _extract_timeline(text: str) -> str:
    if not text:
        return "Timeline: As per law."
    t = re.sub(r"\s+", " ", text).strip()
    if re.search(r"\d{1,2}(st|nd|rd|th)?\s+\w+", t):
        return f"Fixed Date: {t}"
    if "within" in t.lower():
        return f"Relative Timeline: {t}"
    if "before" in t.lower():
        return f"Deadline: {t}"
    return f"Timeline: {t}"

ROUTINE_KEYWORDS = {"annual", "monthly", "quarterly", "half-year", "biannual"}

def _classify(record_type: str) -> str:
    t = (record_type or "").lower()
    return "ROUTINE" if any(k in t for k in ROUTINE_KEYWORDS) else "CONDITIONAL"

def _normalize(rec: dict) -> dict:
    return {
        "id": rec.get("id"),
        "title": rec.get("name"),
        "act": rec.get("act"),
        "section_ref": rec.get("section_ref"),
        "form_code": rec.get("form_no"),
        "due_text": _extract_timeline(rec.get("due_date")),
        "penalty_text": rec.get("penalty"),
        "responsible_entity": rec.get("responsible_entity"),
        "source_category": rec.get("source_category"),
        "status": "PENDING",
        "compliance_type": _classify(rec.get("type", "")),
        "created_at": datetime.utcnow().isoformat() + "Z",
    }

@router.get("/companies/{company_id}/extracted-compliances")
def get_extracted_compliances(company_id: int, q: str = Query("", description="Optional keyword filter")):
    dataset = load_compliances()
    if q:
        ql = q.lower()
        dataset = [r for r in dataset if ql in (r.get("name", "") + " " + r.get("act", "")).lower()]
    normalized = [_normalize(r) for r in dataset]
    routine = [r for r in normalized if r["compliance_type"] == "ROUTINE"]
    conditional = [r for r in normalized if r["compliance_type"] == "CONDITIONAL"]
    return {
        "company_id": company_id,
        "routine": routine,
        "conditional": conditional,
        "count_routine": len(routine),
        "count_conditional": len(conditional),
    }

# ---------------------------
#  PART 2️⃣: AUTO-SCAN MODE
# ---------------------------

BASE_DIR = Path("/app/app/data")

def find_all_pdfs():
    pdfs = []
    for subdir in ["acts", "rules", "forms", "notifications", "others"]:
        folder = BASE_DIR / subdir
        if folder.exists():
            pdfs.extend(folder.glob("*.pdf"))
    # Also include loose PDFs directly inside /data
    pdfs.extend(BASE_DIR.glob("*.pdf"))
    return pdfs

@router.post("/extract/run", summary="Run auto-ingestion of all PDFs under /app/app/data/")
def auto_extract(db: Session = Depends(get_db)):
    pdf_files = find_all_pdfs()
    print(f"🔍 Found {len(pdf_files)} PDF(s): {[p.name for p in pdf_files]}")
    reports = []
    inserted = 0

    for pdf_path in pdf_files:
        try:
            extraction_bundle = extract_from_pdf_file(pdf_path)
            result = persist_extraction_bundle(db, extraction_bundle)
            inserted += result.get("inserted", 0)
            reports.append({"file": pdf_path.name, "status": "ok"})
        except Exception as e:
            reports.append({"file": pdf_path.name, "status": f"error: {e}"})

    return {"processed_files": len(pdf_files), "inserted_compliances": inserted, "reports": reports}

# ---------------------------
#  PART 3️⃣: SINGLE PDF UPLOAD MODE
# ---------------------------

DATA_DIR = Path("/app/app/data/uploads")
DATA_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/extract/pdf", summary="Extract and load compliance data from a single uploaded PDF")
async def extract_and_ingest_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    pdf_path = DATA_DIR / file.filename
    with open(pdf_path, "wb") as f:
        f.write(await file.read())

    try:
        extraction_bundle = extract_from_pdf_file(pdf_path)
        result = persist_extraction_bundle(db, extraction_bundle)
        return {"message": f"✅ Processed {file.filename}", "summary": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
