from __future__ import annotations
import re
from typing import Dict, List


# ---------------------------------------------------------
# Original cleaning logic (untouched)
# ---------------------------------------------------------
def _clean_text(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"[ \t]+", " ", s)
    return s


def normalize_structure(payload: Dict) -> Dict:
    """
    Make the extractor output DB-friendly & idempotent:
      - section_number uppercase & trimmed
      - rule_number uppercase & trimmed
      - dedupe sections/rules/forms by their natural keys
    """
    act_name = _clean_text(payload.get("act_name") or "Unknown Act")
    source_file = payload.get("source_file") or ""

    seen_sections = set()
    n_sections: List[Dict] = []
    for s in payload.get("sections", []):
        key = (_clean_text(s.get("section_number")) or "UNKNOWN").upper()
        if key and key not in seen_sections:
            seen_sections.add(key)
            n_sections.append({
                "section_number": key,
                "description": _clean_text(s.get("body")),
            })

    seen_rules = set()
    n_rules: List[Dict] = []
    for r in payload.get("rules", []):
        key = (_clean_text(r.get("rule_number")) or "UNKNOWN").upper()
        if key and key not in seen_rules:
            seen_rules.add(key)
            n_rules.append({
                "rule_number": key,
                "description": _clean_text(r.get("body")),
            })

    seen_forms = set()
    n_forms: List[Dict] = []
    for f in payload.get("forms", []):
        key = (_clean_text(f.get("form_name")) or "UNKNOWN").upper()
        if key and key not in seen_forms:
            seen_forms.add(key)
            n_forms.append({
                "form_name": key,
                "purpose": _clean_text(f.get("title")),
                "due_days": None,
            })

    penalties = list(dict.fromkeys([_clean_text(p) for p in payload.get("penalties", []) if _clean_text(p)]))

    return {
        "act_name": act_name,
        "source_file": source_file,
        "sections": n_sections,
        "rules": n_rules,
        "forms": n_forms,
        "penalties": penalties,
    }


# ---------------------------------------------------------
# NEW: Compliance classification logic (ROUTINE vs CONDITIONAL)
# ---------------------------------------------------------

_CONDITIONAL_CUE_WORDS = [
    "if ", "where ", "subject to", "provided that", "in the event",
    "upon ", "whenever ", "as applicable", "if applicable", "conditional",
    "only if", "exceed", "exceeds", "threshold", "whichever is lower",
    "turnover", "net worth", "paid-up capital", "listing", "listed company",
    "small company", "private company if", "public company if"
]

_ROUTINE_CUE_WORDS = [
    "annual", "quarterly", "monthly", "half-yearly",
    "within", "every year", "on or before", "each year", "every quarter",
    "before", "due date"
]


def classify_compliance_item(text: str) -> str:
    """Detect compliance type based on textual cues."""
    txt = (text or "").lower()
    if any(word in txt for word in _CONDITIONAL_CUE_WORDS):
        return "CONDITIONAL"
    if any(word in txt for word in _ROUTINE_CUE_WORDS):
        return "ROUTINE"
    return "ROUTINE"  # default safe fallback


def attach_compliance_type(normalized_payload: dict) -> dict:
    """
    Add compliance_type classification to each section/rule/form entry.
    Runs AFTER normalize_structure() — does not change schema.
    """
    for s in normalized_payload.get("sections", []):
        body = s.get("description", "")
        s["compliance_type"] = classify_compliance_item(body)

    for r in normalized_payload.get("rules", []):
        body = r.get("description", "")
        r["compliance_type"] = classify_compliance_item(body)

    for f in normalized_payload.get("forms", []):
        body = f.get("purpose", "")
        f["compliance_type"] = classify_compliance_item(body)

    return normalized_payload
