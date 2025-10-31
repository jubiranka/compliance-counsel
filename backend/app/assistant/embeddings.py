"""
embeddings.py — Compliance Counsel AI Ingestion Pipeline

This script:
1. Reads any compliance-related PDF.
2. Splits it into text chunks.
3. Generates embeddings using SentenceTransformers (MiniLM-L6-v2).
4. Inserts them into cs_documents and cs_vectors tables.
Includes progress bars and structured logging.
"""

import os
import numpy as np
from loguru import logger
from tqdm import tqdm
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, text

# 🧩 --- CONFIGURATION ---
DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@compliance_db:5432/compliance_counsel"
)
CHUNK_SIZE = 800  # characters per chunk
OVERLAP = 100
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# --- Initialize Model & DB ---
logger.info("Loading model...")
model = SentenceTransformer(MODEL_NAME)
engine = create_engine(DB_URL)
logger.info("✅ Model and DB engine initialized.")


# --- Function: Split text into overlapping chunks ---
def chunk_text(text_content, chunk_size=CHUNK_SIZE, overlap=OVERLAP):
    chunks = []
    start = 0
    while start < len(text_content):
        end = min(start + chunk_size, len(text_content))
        chunk = text_content[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


# --- Function: Extract text from PDF ---
def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    full_text = ""
    for page in tqdm(reader.pages, desc="📄 Extracting text"):
        full_text += page.extract_text() or ""
    return full_text


# --- Function: Ingest document ---
def ingest_document(pdf_path, title=None, source_type="PDF", authority=""):
    title = title or os.path.basename(pdf_path)
    logger.info(f"📘 Ingesting document: {title}")

    # avoid variable name clash
    full_text = extract_text_from_pdf(pdf_path)
    chunks = chunk_text(full_text)

    logger.info(f"Total chunks generated: {len(chunks)}")

    # --- Step 1: Insert into cs_documents ---
    with engine.begin() as conn:
        result = conn.execute(
            text("""
                INSERT INTO cs_documents (title, source_type, content, authority)
                VALUES (:title, :source_type, :content, :authority)
                RETURNING id
            """),
            {"title": title, "source_type": source_type, "content": full_text[:1000], "authority": authority},
        )
        doc_id = result.scalar_one()
        logger.success(f"✅ Document inserted with id={doc_id}")

    # --- Step 2: Generate and insert embeddings ---
    vectors = []
    for idx, chunk in enumerate(tqdm(chunks, desc="🧠 Generating embeddings")):
        embedding = model.encode(chunk)
        vectors.append((doc_id, idx, chunk, embedding.tolist()))

    with engine.begin() as conn:
        for doc_id, idx, chunk, emb in tqdm(vectors, desc="💾 Saving to DB"):
            conn.execute(
                text("""
                    INSERT INTO cs_vectors (document_id, chunk_index, chunk_text, embedding)
                    VALUES (:document_id, :chunk_index, :chunk_text, :embedding)
                """),
                {"document_id": doc_id, "chunk_index": idx, "chunk_text": chunk, "embedding": emb},
            )

    logger.success("🎉 Document successfully embedded and saved!")


# --- CLI Entry Point ---
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        logger.error("❌ Usage: python embeddings.py <pdf_path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        logger.error(f"File not found: {pdf_path}")
        sys.exit(1)

    ingest_document(pdf_path)
