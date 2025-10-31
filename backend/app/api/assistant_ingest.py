# backend/app/api/assistant_ingest.py
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date
from typing import Optional
import io

from app.database import get_db

router = APIRouter(prefix="/assistant", tags=["Assistant"])

# --------- PDF text extraction (robust + fallback) ----------
def _extract_text_from_pdf_bytes(data: bytes) -> str:
    # Try pdfminer.six first (handles legal/long PDFs better)
    try:
        from pdfminer.high_level import extract_text
        text_str = extract_text(io.BytesIO(data)) or ""
        cleaned = " ".join(text_str.split())
        if cleaned.strip():
            return cleaned
    except Exception:
        pass

    # Fallback: PyPDF2
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        pages = []
        for p in reader.pages:
            pages.append(p.extract_text() or "")
        text_str = "\n".join(pages)
        cleaned = " ".join(text_str.split())
        return cleaned
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")

# --------- Endpoint: upload PDF → cs_documents ----------
@router.post("/ingest_document", summary="Ingest a legal PDF/circular into cs_documents")
async def ingest_document(
    file: UploadFile = File(..., description="PDF file"),
    title: Optional[str] = Form(None),
    source_type: Optional[str] = Form("other"),
    source_url: Optional[str] = Form(None),
    issued_by: Optional[str] = Form(None),
    issued_on: Optional[date] = Form(None),
    authority: Optional[str] = Form(None),
    act_id: Optional[int] = Form(None),
    section_id: Optional[int] = Form(None),
    rule_id: Optional[int] = Form(None),
    form_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    import json

    # ✅ Step 1: Validate file
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    # ✅ Step 2: Extract text from PDF
    content_text = _extract_text_from_pdf_bytes(data)
    if not content_text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from PDF")

    # ✅ Step 3: Basic metadata
    doc_title = (title or file.filename or "Untitled Document").strip()[:255]
    meta = json.dumps({
        "filename": file.filename,
        "ingest_source": "assistant_ingest_v1"
    })  # ✅ convert Python dict → JSON string (Postgres-safe)

    # ✅ Step 4: Insert into database
    sql = text("""
        INSERT INTO cs_documents
        (title, source_type, source_url, issued_by, issued_on, authority,
         act_id, section_id, rule_id, form_id, content, metadata)
        VALUES
        (:title, :source_type, :source_url, :issued_by, :issued_on, :authority,
         :act_id, :section_id, :rule_id, :form_id, :content, :metadata)
        RETURNING id;
    """)

    try:
        res = db.execute(sql, {
            "title": doc_title,
            "source_type": (source_type or "other").lower(),
            "source_url": source_url,
            "issued_by": issued_by,
            "issued_on": issued_on,
            "authority": authority,
            "act_id": act_id or None,
            "section_id": section_id or None,
            "rule_id": rule_id or None,
            "form_id": form_id or None,
            "content": content_text,
            "metadata": meta,
        })
        new_id = res.scalar()
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB insert failed: {e}")

    # ✅ Step 5: Return success response
    return {
        "status": "ok",
        "document_id": new_id,
        "title": doc_title,
        "source_type": (source_type or "other").lower(),
        "chars": len(content_text),
    }
