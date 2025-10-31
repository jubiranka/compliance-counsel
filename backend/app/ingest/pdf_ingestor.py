"""
Ingestion orchestrator:
- Walk /app/data/pdfs for PDFs
- Skip files already processed (by sha256) using ingestion_log table
- Extract structured data via extractor.extract_from_pdf_file
- Idempotently upsert into acts, sections, rules, compliances
- Record ingestion_log rows (SUCCESS / SKIPPED / FAILED)
"""
from app.ingest.constants import PDF_DIR

import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app import models
from app.ingest.extractor import PDF_DIR, extract_from_pdf_file


# -----------------------------
# Utility: content hash
# -----------------------------
def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


# -----------------------------
# ingestion_log helpers
# -----------------------------
def already_processed(db: Session, sha256: str) -> Optional[models.IngestionLog]:
    return (
        db.query(models.IngestionLog)
        .filter(models.IngestionLog.sha256 == sha256)
        .first()
    )


def record_log(
    db: Session,
    *,
    filename: str,
    sha256: str,
    status: str,
    act_name: Optional[str] = None,
    message: Optional[str] = None,
) -> models.IngestionLog:
    rec = models.IngestionLog(
        filename=filename,
        sha256=sha256,
        status=status,
        act_name=act_name,
        message=message,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


# -----------------------------
# Upsert helpers for core tables
# -----------------------------
def get_or_create_act(db: Session, act_name: str) -> models.Act:
    act = db.query(models.Act).filter(models.Act.name == act_name).first()
    if act:
        return act
    act = models.Act(name=act_name, description=None)
    db.add(act)
    db.commit()
    db.refresh(act)
    return act


def get_or_create_section(
    db: Session,
    *,
    act_id: int,
    section_number: str,
    title: Optional[str],
    body: Optional[str],
) -> models.Section:
    sec = (
        db.query(models.Section)
        .filter(
            and_(
                models.Section.act_id == act_id,
                models.Section.section_number == section_number,
            )
        )
        .first()
    )
    if sec:
        # Optional: update title/body if empty before
        updated = False
        if title and (not sec.description or sec.description.strip() == ""):
            sec.description = title
            updated = True
        if body and (not sec.description or len(body) > len(sec.description or "")):
            # store the richest text we have in description
            sec.description = body[:5000]  # prevent extreme size
            updated = True
        if updated:
            db.add(sec)
            db.commit()
            db.refresh(sec)
        return sec

    sec = models.Section(
        act_id=act_id,
        section_number=section_number,
        description=(body or title),
    )
    db.add(sec)
    db.commit()
    db.refresh(sec)
    return sec


def get_or_create_rule(
    db: Session,
    *,
    act_id: int,
    rule_number: str,
    title: Optional[str],
    body: Optional[str],
) -> models.Rule:
    rule = (
        db.query(models.Rule)
        .filter(
            and_(
                models.Rule.act_id == act_id,
                models.Rule.rule_number == rule_number,
            )
        )
        .first()
    )
    if rule:
        # Update description if we get richer text
        if body and (not rule.description or len(body) > len(rule.description or "")):
            rule.description = body[:5000]
            db.add(rule)
            db.commit()
            db.refresh(rule)
        return rule

    rule = models.Rule(
        act_id=act_id,
        rule_number=rule_number,
        description=body or title,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def create_compliance_if_new(
    db: Session,
    *,
    act_id: int,
    section_id: Optional[int],
    rule_id: Optional[int],
    remarks: str,
):
    """
    Create a compliance row if an identical 'remarks' with same act/section/rule
    is not already present. This prevents duplicates while staying simple.
    """
    existing = (
        db.query(models.Compliance)
        .filter(
            and_(
                models.Compliance.act_id == act_id,
                models.Compliance.section_id == section_id,
                models.Compliance.rule_id == rule_id,
                models.Compliance.remarks == remarks,
            )
        )
        .first()
    )
    if existing:
        return existing

    comp = models.Compliance(
        act_id=act_id,
        section_id=section_id,
        rule_id=rule_id,
        due_date=None,           # we only store hints in remarks for now
        remarks=remarks[:8000],  # keep it bounded
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp


# -----------------------------
# Entry point
# -----------------------------
def run_ingestion(db: Session) -> Dict[str, Any]:
    """
    - Scan /app/data/pdfs for *.pdf
    - Skip previously processed files (by SHA-256)
    - Extract structured content
    - Upsert: Act, Sections, Rules, Compliances
    - Log SUCCESS / SKIPPED / FAILED
    """
    PDF_DIR.mkdir(parents=True, exist_ok=True)

    processed: List[Dict[str, Any]] = []

    for path in sorted(PDF_DIR.glob("*.pdf")):
        sha = file_sha256(path)
        # Skip if already processed
        if already_processed(db, sha):
            processed.append(
                {"file": path.name, "status": "SKIPPED", "reason": "already ingested"}
            )
            continue

        try:
            extracted = extract_from_pdf_file(path)  # <- high-accuracy parse
            act_name = extracted.get("act_name") or path.stem
            act = get_or_create_act(db, act_name)

            # Sections
            for sec in extracted.get("sections", []):
                sec_obj = get_or_create_section(
                    db,
                    act_id=act.id,
                    section_number=str(sec.get("section_number") or "").strip(),
                    title=sec.get("title"),
                    body=sec.get("body"),
                )

                # Rules under this section block (rules themselves are attached to act)
                for r in sec.get("rules", []):
                    rule_obj = get_or_create_rule(
                        db,
                        act_id=act.id,
                        rule_number=str(r.get("rule_number") or "").strip(),
                        title=r.get("title"),
                        body=r.get("body"),
                    )
                    # Compliances tied explicitly to this rule (if any)
                    for comp in sec.get("compliances", []):
                        # Attach this compliance to both section & possibly the rule
                        # (We attach to the ACT + SECTION, and also link rule_id for context.)
                        remarks = build_compliance_remarks(comp)
                        create_compliance_if_new(
                            db,
                            act_id=act.id,
                            section_id=sec_obj.id,
                            rule_id=rule_obj.id,
                            remarks=remarks,
                        )

                # If no rules, still persist compliances discovered at section level
                if not sec.get("rules"):
                    for comp in sec.get("compliances", []):
                        remarks = build_compliance_remarks(comp)
                        create_compliance_if_new(
                            db,
                            act_id=act.id,
                            section_id=sec_obj.id,
                            rule_id=None,
                            remarks=remarks,
                        )

            # mark success
            record_log(
                db,
                filename=path.name,
                sha256=sha,
                status="SUCCESS",
                act_name=act_name,
                message=f"Ingested with {len(extracted.get('sections', []))} sections",
            )
            processed.append(
                {"file": path.name, "status": "SUCCESS", "act": act.name}
            )

        except Exception as e:
            # log failure
            record_log(
                db,
                filename=path.name,
                sha256=sha,
                status="FAILED",
                act_name=None,
                message=str(e),
            )
            processed.append({"file": path.name, "status": "FAILED", "error": str(e)})

    summary = {
        "scanned_dir": str(PDF_DIR),
        "processed": processed,
        "counts": {
            "success": sum(1 for p in processed if p["status"] == "SUCCESS"),
            "skipped": sum(1 for p in processed if p["status"] == "SKIPPED"),
            "failed": sum(1 for p in processed if p["status"] == "FAILED"),
            "total": len(processed),
        },
    }
    return summary


def build_compliance_remarks(comp: Dict[str, Any]) -> str:
    """
    Produce a stable, human-readable remark from extracted compliance dict.
    Keeping it text-first ensures we never lose signal while our due/form
    parser becomes more sophisticated over time.
    """
    parts = [comp.get("summary", "").strip()]
    if comp.get("form_hint"):
        parts.append(f"[Form: {comp['form_hint']}]")
    if comp.get("due_hint"):
        parts.append(f"[Due: {comp['due_hint']}]")
    if comp.get("penalty_hint"):
        parts.append(f"[Penalty: {comp['penalty_hint']}]")
    remark = " ".join(p for p in parts if p)
    return remark[:8000]
