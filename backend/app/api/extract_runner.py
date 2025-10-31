"""
extract_runner.py
-----------------
Background ingestion runner for Compliance Counsel.
Scans the acts directory, extracts data from PDFs, and saves to DB.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pathlib import Path
from app.database import get_db
from app.ingest.extractor import extract_from_pdf_file
from app.ingest.db_loader import persist_extraction_bundle

import logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Extraction Runner"])

# ✅ Correct folder path inside container
ACTS_DIR = Path("/app/app/data/acts")
ACTS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/extract/run", summary="Scan acts folder and ingest all PDFs")
def run_extraction_job(db: Session = Depends(get_db)):
    """
    Finds all PDFs under /app/app/data/acts and runs the extraction pipeline.
    """
    pdfs = list(ACTS_DIR.glob("*.pdf"))
    logger.info(f"🔍 Found {len(pdfs)} PDF(s): {[p.name for p in pdfs]}")

    processed = 0
    reports = []

    for pdf_path in pdfs:
        logger.info(f"📘 Extracting from {pdf_path.name}")
        bundle = extract_from_pdf_file(pdf_path)
        result = persist_extraction_bundle(db, bundle)
        reports.append({"file": pdf_path.name, "summary": result})
        processed += 1

    logger.info(f"✅ Completed extraction: {processed} file(s) processed")
    return {"processed_files": processed, "inserted_compliances": processed, "reports": reports}
