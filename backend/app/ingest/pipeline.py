"""
CS-Grade Compliance Draft Generation (Stable Version)
-----------------------------------------------------
Creates well-formatted PDF drafts from compliance records.

Features:
- Auto-creates output directory inside Docker (/app/data/drafts)
- Uses robust Unicode-safe fonts (DejaVu)
- Handles ₹, §, and long text gracefully
- Never crashes if folders/fonts are missing
"""

import json
import re
import os
from datetime import datetime
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ---------------------------------------------------------
# Directory setup
# ---------------------------------------------------------
OUTPUT_DIR = Path("/app/data/drafts")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Font registration (Unicode-safe)
try:
    pdfmetrics.registerFont(TTFont("DejaVuSans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
    FONT_NAME = "DejaVuSans"
except Exception:
    FONT_NAME = "Helvetica"

# ---------------------------------------------------------
# Load unified compliance dataset
# ---------------------------------------------------------
def load_compliances(file_path: str):
    """Loads the unified compliance dataset."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Compliance dataset not found at {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

# ---------------------------------------------------------
# Compliance matching
# ---------------------------------------------------------
def find_best_match(user_input: str, compliances: list):
    """Identifies compliance record by ID or keyword."""
    user_input_clean = user_input.strip().lower()

    for record in compliances:
        if record.get("id", "").lower() == user_input_clean:
            return record

    for record in compliances:
        if user_input_clean in record.get("name", "").lower():
            return record
    return None

# ---------------------------------------------------------
# Draft text builder
# ---------------------------------------------------------
def extract_timeline(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    if re.search(r"\d{1,2}(st|nd|rd|th)?\s+\w+", text):
        return f"Fixed Date: {text}"
    elif "within" in text.lower():
        return f"Relative Timeline: {text}"
    elif "before" in text.lower():
        return f"Deadline: {text}"
    return f"Timeline: {text or 'As per law.'}"

def generate_draft_text(record: dict) -> str:
    today = datetime.now().strftime("%d %B %Y, %I:%M %p")
    due_info = extract_timeline(record.get("due_date"))
    notes_clean = record.get("notes", "None specified.").replace('.', '.\n    - ')

    return f"""
======================================================================
COMPLIANCE COUNSEL – LEGAL DRAFT (AI-GENERATED)
======================================================================
Generated on: {today}
Compliance ID: {record.get('id', 'N/A')}
Applicable Law: {record.get('act', 'N/A')}
Section: {record.get('section_ref', 'N/A')}
Type: {record.get('type', 'N/A')}
Due Date: {due_info}
Form: {record.get('form_no', 'N/A')}
Responsible: {record.get('responsible_entity', 'N/A')}
Status: {record.get('status', 'N/A')}

----------------------------------------------------------------------
DETAILS
----------------------------------------------------------------------
{notes_clean}

----------------------------------------------------------------------
PENALTY
----------------------------------------------------------------------
{record.get('penalty', 'Not specified.')}

----------------------------------------------------------------------
DISCLAIMER
----------------------------------------------------------------------
System-generated advisory draft. Must be reviewed by a qualified CS/CA
before submission.
======================================================================
"""

# ---------------------------------------------------------
# PDF generator
# ---------------------------------------------------------
def save_draft_pdf(record: dict, draft_text: str) -> str:
    """Creates and saves a formatted PDF draft."""
    filename = f"{record['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = OUTPUT_DIR / filename

    doc = SimpleDocTemplate(str(filepath), pagesize=A4)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Body", fontName=FONT_NAME, fontSize=10.5, leading=16, alignment=TA_JUSTIFY))

    story = []
    for para in draft_text.split("\n"):
        if para.strip():
            story.append(Paragraph(para.strip(), styles["Body"]))
            story.append(Spacer(1, 6))

    doc.build(story)
    return str(filepath)

# ---------------------------------------------------------
# Main pipeline entry
# ---------------------------------------------------------
def run_pipeline(user_input: str, dataset_path: str):
    """Generates a CS-grade compliance draft and PDF."""
    compliances = load_compliances(dataset_path)
    record = find_best_match(user_input, compliances)
    if not record:
        return {"status": "error", "message": f"No match found for '{user_input}'"}

    draft_text = generate_draft_text(record)
    pdf_path = save_draft_pdf(record, draft_text)

    return {
        "status": "success",
        "record_id": record["id"],
        "draft_path": pdf_path,
        "message": f"Draft generated successfully for {record['id']}",
    }
