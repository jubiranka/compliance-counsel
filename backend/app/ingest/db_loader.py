"""
DB Loader Module ✅ SCHEDULER-INTEGRATED
----------------------------------------
Integrates directly with SQLAlchemy models to persist Acts, Sections,
Rules, Forms, Penalties, and Compliances extracted from PDFs.

Enhancements:
- Safe for use with APScheduler & daily ingestion jobs.
- Supports both manual `/extract/run` triggers and auto-scheduler runs.
- Uses ingestion_log for idempotency (sha256 check).
- Stable with enums & audit logging.

This version inserts at least one Compliance per Section (fallback),
so your compliances table is never empty when sections are extracted.
"""

from __future__ import annotations
from typing import Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
from datetime import datetime
from app import models
from app.ingest.extractor import PDF_DIR
import hashlib
import os

# ----------------------------------------------------------------------
# ENUM SAFETY HELPERS
# ----------------------------------------------------------------------
def safe_status(value: Optional[str]) -> models.ComplianceStatus:
    allowed = {e.value for e in models.ComplianceStatus}
    return models.ComplianceStatus(value) if value in allowed else models.ComplianceStatus.PENDING

def safe_verified_status(value: Optional[str]) -> str:
    allowed = {"UNVERIFIED", "PENDING_REVIEW", "APPROVED", "REJECTED"}
    return value if value in allowed else "UNVERIFIED"

def safe_priority(value: Optional[str]) -> str:
    allowed = {"LOW", "MEDIUM", "HIGH"}
    return value if value in allowed else "MEDIUM"

# ----------------------------------------------------------------------
# BASIC GET-OR-CREATE FUNCTIONS
# ----------------------------------------------------------------------
def _get_or_create_act(db: Session, act_name: str) -> models.Act:
    act = db.query(models.Act).filter(models.Act.name == act_name).first()
    if act:
        return act
    act = models.Act(name=act_name, description=None)
    db.add(act); db.commit(); db.refresh(act)
    return act

def _get_or_create_section(db: Session, act_id: int, section_number: str, description: Optional[str]) -> models.Section:
    s = (
        db.query(models.Section)
        .filter(models.Section.act_id == act_id, models.Section.section_number == section_number)
        .first()
    )
    if s:
        if description and (not s.description or len(description) > len(s.description)):
            s.description = description
            db.commit()
        return s
    s = models.Section(act_id=act_id, section_number=section_number, description=description)
    db.add(s); db.commit(); db.refresh(s)
    return s

def _get_or_create_rule(db: Session, act_id: int, rule_number: str, description: Optional[str]) -> models.Rule:
    r = db.query(models.Rule).filter(models.Rule.act_id == act_id, models.Rule.rule_number == rule_number).first()
    if r:
        if description and (not r.description or len(description) > len(r.description)):
            r.description = description
            db.commit()
        return r
    r = models.Rule(act_id=act_id, rule_number=rule_number, description=description)
    db.add(r); db.commit(); db.refresh(r)
    return r

def _get_or_create_form(db: Session, form_name: Optional[str], purpose: Optional[str], due_days: Optional[int]) -> Optional[models.Form]:
    if not form_name:
        return None
    f = db.query(models.Form).filter(func.lower(models.Form.form_name) == form_name.lower()).first()
    if f:
        if purpose and (not f.purpose or len(purpose) > len(f.purpose)):
            f.purpose = purpose
            db.commit()
        return f
    f = models.Form(form_name=form_name, purpose=purpose, due_days=due_days)
    db.add(f); db.commit(); db.refresh(f)
    return f

def _attach_penalty(db: Session, section_id: int, penalty_text: str):
    exists = db.query(models.Penalty).filter(
        models.Penalty.section_id == section_id,
        models.Penalty.remarks == penalty_text
    ).first()
    if not exists:
        pen = models.Penalty(section_id=section_id, amount=None, remarks=penalty_text)
        db.add(pen); db.commit()

# ----------------------------------------------------------------------
# INGESTION LOG + SHA256
# ----------------------------------------------------------------------
def _file_sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""): h.update(chunk)
    return h.hexdigest()

def _already_ingested(db: Session, filename: str) -> bool:
    file_path = str(PDF_DIR / filename)
    if not os.path.exists(file_path):
        return False
    sha = _file_sha256(file_path)
    return db.query(models.IngestionLog).filter(
        models.IngestionLog.sha256 == sha,
        models.IngestionLog.status == "SUCCESS"
    ).first() is not None

# ----------------------------------------------------------------------
# COMPLIANCE UPSERT
# ----------------------------------------------------------------------
def _upsert_compliance(
    db: Session,
    act_id: int,
    section_id: Optional[int],
    rule_id: Optional[int],
    form_id: Optional[int],
    summary: str,
    status: Optional[str],
):
    """Insert or update compliance (dedupe by act+section+form+short summary)."""
    key_summary = (summary or "").strip()
    if not key_summary:
        key_summary = "Compliance requirement"

    existing = db.query(models.Compliance).filter(
        models.Compliance.act_id == act_id,
        models.Compliance.section_id == section_id,
        models.Compliance.form_id == form_id,
        models.Compliance.remarks == key_summary[:255],
    ).first()

    status_enum = safe_status(status)
    if existing:
        changed = False
        if len(summary or "") > len(existing.remarks or ""):
            existing.remarks = summary
            changed = True
        if existing.status != status_enum:
            existing.status = status_enum
            changed = True
        if changed:
            existing.updated_at = datetime.utcnow()
            db.commit()
        return existing

    c = models.Compliance(
        act_id=act_id,
        section_id=section_id,
        rule_id=rule_id,
        form_id=form_id,
        remarks=key_summary,
        status=status_enum,
        due_date=None,
        verified_status="UNVERIFIED",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(c); db.commit(); db.refresh(c)
    return c

# ----------------------------------------------------------------------
# MAIN: persist a normalized bundle
# ----------------------------------------------------------------------
def persist_extraction_bundle(db: Session, bundle: Dict) -> Dict:
    """
    Persist a normalized extraction bundle (from extractor.normalize_structure)
    into PostgreSQL using idempotent upserts.

    Guarantees:
    - Creates Act/Sections/Rules/Forms as needed.
    - Inserts at least one Compliance per Section when none are listed.
    - Writes an ingestion_log with SUCCESS/FAILED and counts.
    """
    filename = bundle.get("source_file", "unknown.pdf")
    act_name = bundle.get("act_name", "Unknown Act")

    # Idempotency check (only if same exact file already SUCCESS)
    if _already_ingested(db, filename):
        return {"status": "skipped", "message": f"{filename} already ingested", "inserted": {"sections": 0, "rules": 0, "forms": 0, "compliances": 0}}

    # Compute sha if file exists; else fall back to a deterministic token
    file_path = PDF_DIR / filename
    sha256_hash = _file_sha256(str(file_path)) if file_path.exists() else f"sha256-{hash(filename)}"

    try:
        act = _get_or_create_act(db, act_name)
        inserted_sections = inserted_rules = inserted_forms = inserted_compliances = 0

        for s in bundle.get("sections", []):
            section = _get_or_create_section(db, act.id, s.get("section_number", "?"), s.get("title"))
            inserted_sections += 1

            # Rules (optional)
            for r in s.get("rules", []) or []:
                _get_or_create_rule(db, act.id, r.get("rule_number", "?"), r.get("title"))
                inserted_rules += 1

            # Compliances
            compliances = s.get("compliances") or []
            if not compliances:
                # 🔧 Fallback: derive one default compliance from section
                sec_title = (s.get("title") or "").strip()
                sec_num = s.get("section_number") or "Unknown"
                derived_summary = sec_title or f"Compliance for Section {sec_num}"
                _upsert_compliance(
                    db=db,
                    act_id=act.id,
                    section_id=section.id,
                    rule_id=None,
                    form_id=None,
                    summary=derived_summary,
                    status="PENDING",
                )
                inserted_compliances += 1
            else:
                for c in compliances:
                    form = _get_or_create_form(db, c.get("form_hint"), None, None) if c.get("form_hint") else None
                    _upsert_compliance(
                        db=db,
                        act_id=act.id,
                        section_id=section.id,
                        rule_id=None,
                        form_id=form.id if form else None,
                        summary=c.get("summary") or (s.get("title") or f"Compliance for Section {s.get('section_number','?')}"),
                        status=c.get("status"),
                    )
                    inserted_compliances += 1

                    # Optional penalties
                    if c.get("penalty_hint"):
                        _attach_penalty(db, section.id, c["penalty_hint"])

        # Ingestion log
        log = models.IngestionLog(
            filename=filename,
            sha256=sha256_hash,
            status="SUCCESS",
            act_name=act_name,
            message=f"Inserted {inserted_sections} sections, {inserted_rules} rules, {inserted_forms} forms, {inserted_compliances} compliances.",
            created_at=datetime.utcnow(),
        )
        db.add(log); db.commit()

        return {
            "status": "success",
            "act": act_name,
            "inserted": {
                "sections": inserted_sections,
                "rules": inserted_rules,
                "forms": inserted_forms,
                "compliances": inserted_compliances,
            },
        }

    except SQLAlchemyError as e:
        db.rollback()
        log = models.IngestionLog(
            filename=filename,
            sha256=sha256_hash,
            status="FAILED",
            act_name=act_name,
            message=str(e),
            created_at=datetime.utcnow(),
        )
        db.add(log); db.commit()
        raise

# ----------------------------------------------------------------------
# Compatibility wrapper
# ----------------------------------------------------------------------
def load_normalized(db: Session, payload: Dict):
    return persist_extraction_bundle(db, payload)
