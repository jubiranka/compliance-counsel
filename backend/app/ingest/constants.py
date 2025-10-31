# backend/app/ingest/constants.py
from pathlib import Path
import os

def _default_data_dir() -> Path:
    # repo_root/backend/app/ingest/constants.py → repo_root
    repo_root = Path(__file__).resolve().parents[2]
    return repo_root / "data" / "pdfs"

DATA_DIR = Path(os.getenv("DATA_DIR", str(_default_data_dir()))).resolve()
PDF_DIR = DATA_DIR  # alias used by other modules
