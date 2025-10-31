from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from textwrap import wrap

# ✅ Load free open-source embedding model
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def chunk_text(text: str, max_chars: int = 1500, overlap: int = 150):
    """Split text into overlapping chunks for better semantic coherence."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + max_chars
        chunks.append(text[start:end])
        start += max_chars - overlap
    return chunks

def store_embeddings_for_document(doc_id: int, db: Session = None):
    """Create embeddings for each chunk of a document and store them locally."""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    doc = db.query(models.CSDocument).get(doc_id)
    if not doc:
        raise ValueError(f"Document {doc_id} not found")

    chunks = chunk_text(doc.content)
    print(f"📘 Creating embeddings for {len(chunks)} chunks using MiniLM...")

    for i, chunk in enumerate(chunks):
        try:
            vector = model.encode(chunk, convert_to_numpy=True).tolist()
            record = models.CSVector(
                document_id=doc.id,
                chunk_index=i,
                chunk_text=chunk,
                embedding=vector,
            )
            db.add(record)
        except Exception as e:
            print(f"⚠️ Failed on chunk {i}: {e}")
            continue

    db.commit()
    if close_db:
        db.close()
    print(f"✅ Stored embeddings for document {doc_id}")
