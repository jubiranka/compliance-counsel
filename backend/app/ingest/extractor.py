"""
Smart Compliance Extraction Engine – integrates AI-grade logic for
Companies Act, Income Tax Act, FEMA, SEBI, etc.

Output: dict compatible with normalize_structure() + DB schema.
"""

import re
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from PyPDF2 import PdfReader

PDF_DIR = Path("/app/data/pdfs")

# -----------------------------
# Regex Patterns
# -----------------------------
SECTION_HEADER_RE = re.compile(r"(?im)^\s*(?:Section|Sec\.)\s+(\d+[A-Z\-]*)\s*[:\-]?\s*(.*)$")
RULE_HEADER_RE = re.compile(r"(?im)^\s*(?:Rule)\s+(\d+[A-Z\-]*)\s*[:\-]?\s*(.*)$")

FORM_RE = re.compile(r"\b(Form|FORM)\s*[-\s]?\b([A-Z]{2,}\-?\d{0,3})\b")
PENALTY_RE = re.compile(
    r"(?i)(penalty|fine|imprisonment|liable).*?((₹|Rs\.?)\s?[\d,]+|\d+\s?(lakh|crore|months?|years?))"
)

COMPLIANCE_VERBS = [
    r"shall", r"must", r"required to", r"is required to",
    r"responsible for", r"file", r"submit", r"maintain",
    r"constitute", r"appoint", r"register", r"obtain", r"report"
]

# -----------------------------
# Utility Helpers
# -----------------------------
def read_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    chunks = []
    for page in reader.pages:
        try:
            txt = page.extract_text() or ""
        except Exception:
            txt = ""
        chunks.append(txt)
    return "\n".join(chunks)

def clean_text(txt: str) -> str:
    txt = re.sub(r"\u00a0", " ", txt)
    txt = re.sub(r"[ \t]+", " ", txt)
    txt = re.sub(r"\n{3,}", "\n\n", txt)
    return txt.strip()

# -----------------------------
# Section + Rule Splitters
# -----------------------------
def split_sections(full_text: str) -> List[Dict[str, Any]]:
    sections: List[Dict[str, Any]] = []
    headers = [(m.start(), m.end(), m.group(1), (m.group(2) or "").strip())
               for m in SECTION_HEADER_RE.finditer(full_text)]
    if not headers:
        return sections
    end_pos = len(full_text)
    for idx, (s, e, sec_no, title) in enumerate(headers):
        body_start = e
        body_end = headers[idx + 1][0] if idx + 1 < len(headers) else end_pos
        body = full_text[body_start:body_end].strip()
        sections.append({
            "section_number": sec_no,
            "title": title,
            "body": body
        })
    return sections

def extract_rules_from_block(block_text: str) -> List[Dict[str, Any]]:
    rules: List[Dict[str, Any]] = []
    matches = [(m.start(), m.end(), m.group(1), (m.group(2) or "").strip())
               for m in RULE_HEADER_RE.finditer(block_text)]
    if not matches:
        return rules
    end_pos = len(block_text)
    for i, (s, e, rno, rtitle) in enumerate(matches):
        rb_start = e
        rb_end = matches[i + 1][0] if i + 1 < len(matches) else end_pos
        rbody = block_text[rb_start:rb_end].strip()
        rules.append({
            "rule_number": rno,
            "title": rtitle,
            "body": rbody
        })
    return rules

# -----------------------------
# Compliance Extraction Logic
# -----------------------------
def extract_compliances_from_text(txt: str) -> List[Dict[str, Any]]:
    sentences = re.split(r"(?<=[\.\?\!])\s+(?=[A-Z(])", txt)
    results: List[Dict[str, Any]] = []
    verb_re = re.compile(r"|".join(COMPLIANCE_VERBS), flags=re.IGNORECASE)

    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) < 25:
            continue
        if verb_re.search(s_clean):
            form_hint = None
            m_form = FORM_RE.search(s_clean)
            if m_form:
                form_hint = m_form.group(2)
            penalty_hint = None
            m_pen = PENALTY_RE.search(s_clean)
            if m_pen:
                penalty_hint = m_pen.group(0)
            m_due = re.search(r"(?i)(within\s+\d+\s+(days?|months?|years?)|\b\d+\s+(days?|months?|years?)\b)", s_clean)
            due_hint = m_due.group(0) if m_due else None
            results.append({
                "summary": s_clean,
                "due_hint": due_hint,
                "form_hint": form_hint,
                "penalty_hint": penalty_hint
            })
    return results

# -----------------------------
# Classification: Routine vs Conditional
# -----------------------------
def classify_compliance(summary: str) -> str:
    summary_lower = summary.lower()
    if any(x in summary_lower for x in ["if", "where", "subject to", "provided that", "in case of", "upon", "unless"]):
        return "CONDITIONAL"
    return "ROUTINE"

# -----------------------------
# MAIN EXTRACTOR FUNCTION
# -----------------------------
def extract_from_pdf_file(pdf_path: Path, act_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Unified extraction pipeline – PDF → structured compliances
    """
    raw_text = read_pdf_text(pdf_path)
    text = clean_text(raw_text)
    act_name = act_name or pdf_path.stem.strip()
    sections = split_sections(text)

    enriched_sections: List[Dict[str, Any]] = []
    for sec in sections:
        s_body = sec["body"]
        rules = extract_rules_from_block(s_body)
        compliances_raw = extract_compliances_from_text(s_body)
        compliances = []
        for c in compliances_raw:
            compliance_type = classify_compliance(c["summary"])
            compliances.append({
                "summary": c["summary"],
                "due_hint": c["due_hint"],
                "form_hint": c["form_hint"],
                "penalty_hint": c["penalty_hint"],
                "compliance_type": compliance_type,
                "status": "PENDING",
                "created_at": datetime.utcnow().isoformat()
            })
        enriched_sections.append({
            "section_number": sec["section_number"],
            "title": sec["title"],
            "body": s_body,
            "rules": rules,
            "compliances": compliances
        })

    result = {
        "act_name": act_name,
        "source_file": pdf_path.name,
        "sections": enriched_sections
    }
    print(f"✅ Extracted {len(enriched_sections)} sections from {pdf_path.name}")
    return result
