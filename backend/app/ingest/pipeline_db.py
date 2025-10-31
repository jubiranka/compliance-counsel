# app/ingest/pipeline_db.py
"""
DB-Backed Extraction Pipeline (Scheduler-Compatible)
----------------------------------------------------
Reads all PDFs from PDF_DIR, runs the extraction pipeline, and loads
the results into PostgreSQL using db_loader.persist_extraction_bundle().
Ensures idempotent ingestion by checking ingestion_log.sha256.
"""

from __future__ import annotations
import hashlib
from pathlib import Path
from typing import Dict, List
from sqlalchemy.orm import Session
from app.ingest.extractor import extract_from_pdf_file, PDF_DIR
from app.ingest.text_cleaner import normalize_structure, attach_compliance_type
from app.ingest.db_loader import persist_extraction_bundle
from app import models

def _file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""): h.update(chunk)
    return h.hexdigest()

def _already_ingested(db: Session, sha256: str) -> bool:
    return (
        db.query(models.IngestionLog)
        .filter(models.IngestionLog.sha256 == sha256, models.IngestionLog.status == "SUCCESS")
        .first()
        is not None
    )

def extract_all_new(db: Session) -> Dict:
    """
    Extracts and loads all NEW (unprocessed) PDFs from PDF_DIR.
    For each PDF:
      - extract_from_pdf_file()
      - normalize_structure() + attach_compliance_type()
      - persist_extraction_bundle()
      - Log result in ingestion_log
    """
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    reports: List[Dict] = []
    total_inserted_compliances = 0

    for path in sorted(PDF_DIR.glob("*.pdf")):
        sha = _file_sha256(path)
        if _already_ingested(db, sha):
            continue

        try:
            raw = extract_from_pdf_file(path)
            raw["source_file"] = path.name
            norm = normalize_structure(raw)
            norm = attach_compliance_type(norm)
            norm["source_file"] = path.name

            result = persist_extraction_bundle(db, norm)
            inserted = result.get("inserted", {})
            total_inserted_compliances += int(inserted.get("compliances", 0))
            reports.append({
                "file": path.name,
                "status": result.get("status", "success"),
                "inserted": inserted
            })

        except Exception as e:
            reports.append({"file": path.name, "error": str(e)})

    return {"processed_files": len(reports), "inserted_compliances": total_inserted_compliances, "reports": reports}
