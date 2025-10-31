# backend/app/api/assistant_ask.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import numpy as np
from typing import Optional, List, Dict, Any
from sqlalchemy import create_engine, text
import httpx  # ensure installed
from duckduckgo_search import DDGS  # fallback search

# -----------------------------------------------------------------------------
# Safe threading for numpy/torch inside containers (prevents worker crashes)
# -----------------------------------------------------------------------------
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")

router = APIRouter(prefix="/assistant", tags=["Assistant"])

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@compliance_db:5432/compliance_counsel",
)
MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# Detect Ollama endpoint (Docker/host both OK)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://host.docker.internal:11434/api/generate")

# -----------------------------------------------------------------------------
# Singletons (lazy)
# -----------------------------------------------------------------------------
_engine = create_engine(DB_URL, pool_pre_ping=True)
_model = None  # lazy-loaded
_last_ollama_ok = False

# Simple in-memory cache of last answers
memory_cache: List[Dict[str, str]] = []  # [{q, a}]


def _get_model():
    """Lazy load the sentence transformer the first time it's needed."""
    global _model
    if _model is None:
        print("🔧 [assistant] Loading embedding model:", MODEL_NAME, flush=True)
        # Import here to defer heavy import until first use
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(MODEL_NAME)
        print("✅ [assistant] Embedding model loaded.", flush=True)
    return _model


# -----------------------------------------------------------------------------
# Schemas
# -----------------------------------------------------------------------------
class AskRequest(BaseModel):
    question: str
    k: int = 8
    authority: Optional[str] = None
    source_type: Optional[str] = None


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def _cos_sim(a: np.ndarray, b: np.ndarray) -> float:
    an, bn = np.linalg.norm(a), np.linalg.norm(b)
    return 0.0 if an == 0.0 or bn == 0.0 else float(np.dot(a, b) / (an * bn))


def _search_web(query: str) -> str:
    """Very small web fallback so we always return *something*."""
    try:
        with DDGS() as ddg:
            results = [r.get("body", "") for r in ddg.text(query, max_results=5)]
            out = "\n\n".join([s for s in results if s])[:1000]
            return out
    except Exception as e:
        print("⚠️ [assistant] Web search error:", e, flush=True)
        return ""


def _ollama_generate(prompt: str, model: str = "llama3") -> str:
    """Call Ollama with guardrails & timeouts."""
    global _last_ollama_ok
    try:
        with httpx.Client(timeout=httpx.Timeout(90.0)) as client:
            r = client.post(
                OLLAMA_URL,
                json={"model": model, "prompt": prompt, "stream": False},
                headers={"Content-Type": "application/json"},
            )
            r.raise_for_status()
            data = r.json()
            _last_ollama_ok = True
            return (data.get("response") or "").strip()
    except Exception as e:
        _last_ollama_ok = False
        print(f"⚠️ [assistant] Ollama call failed: {e}", flush=True)
        return ""


def _top_k_chunks(
    q_emb: np.ndarray, rows: List[Dict[str, Any]], k: int
) -> List[Dict[str, Any]]:
    scored: List[Dict[str, Any]] = []
    for r in rows:
        emb = r.get("embedding")
        if not emb:
            continue
        try:
            sim = _cos_sim(q_emb, np.array(emb, dtype=np.float32))
        except Exception:
            continue
        scored.append({"sim": sim, "row": r})

    scored.sort(key=lambda x: x["sim"], reverse=True)
    return scored[: max(1, min(k, 20))]


# -----------------------------------------------------------------------------
# Health / Debug
# -----------------------------------------------------------------------------
@router.get("/health", summary="Assistant health")
def health():
    return {
        "status": "ok",
        "ollama_ok": _last_ollama_ok,
        "model_loaded": _model is not None,
    }


@router.get("/debug/ollama", summary="Probe Ollama")
def debug_ollama():
    txt = _ollama_generate("Say 'pong' once.")
    return {"ok": bool(txt), "sample": txt[:80]}


# -----------------------------------------------------------------------------
# Main endpoint
# -----------------------------------------------------------------------------
@router.post("/ask", summary="Ask compliance questions via DB + LLaMA with web fallback")
def ask(req: AskRequest):
    q = (req.question or "").strip()
    if not q:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # 1) Try memory cache
    for item in reversed(memory_cache[-12:]):
        if q.lower() in item["q"].lower():
            return {"question": q, "answer": item["a"], "source": "memory", "results": []}

    # 2) Build SQL with optional filters
    sql = """
        SELECT v.id, v.document_id, v.chunk_index, v.chunk_text, v.embedding,
               d.title AS doc_title, d.authority AS doc_authority, d.source_type AS doc_source_type
        FROM cs_vectors v
        LEFT JOIN cs_documents d ON d.id = v.document_id
    """
    params: Dict[str, Any] = {}
    filters: List[str] = []
    if req.authority:
        filters.append("d.authority = :authority")
        params["authority"] = req.authority
    if req.source_type:
        filters.append("d.source_type = :source_type")
        params["source_type"] = req.source_type
    if filters:
        sql += " WHERE " + " AND ".join(filters)
    sql += " ORDER BY v.id ASC LIMIT 20000"

    # 3) Fetch rows
    try:
        with _engine.begin() as conn:
            rows = conn.execute(text(sql), params).mappings().all()
    except Exception as e:
        print("❌ [assistant] DB read failed:", e, flush=True)
        raise HTTPException(status_code=500, detail=f"DB read failed: {e}")

    if not rows:
        # If nothing indexed yet, go straight to web fallback
        web_txt = _search_web(q)
        if web_txt:
            return {"question": q, "answer": "(Web) " + web_txt, "source": "web", "results": []}
        raise HTTPException(status_code=404, detail="No indexed documents found.")

    # 4) Embed question (lazy model load)
    try:
        model = _get_model()
        q_emb = model.encode(q).astype(np.float32)
    except Exception as e:
        print("❌ [assistant] Embedding failed:", e, flush=True)
        # As a last resort: web
        web_txt = _search_web(q)
        if web_txt:
            return {"question": q, "answer": "(Web) " + web_txt, "source": "web", "results": []}
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    # 5) Similarity search
    top = _top_k_chunks(q_emb, rows, req.k)
    context = "\n\n".join(t["row"]["chunk_text"] for t in top)
    best_sim = top[0]["sim"] if top else 0.0

    # 6) Build prompt
    prompt = f"""You are an expert Indian Company Secretary AI.
Answer the user's query precisely based on the legal context below.
If the answer is not present, say: "Not found in document. Checking general sources..."

Context:
{context}

Question:
{q}

Answer:
"""

    # 7) Ask LLaMA (Ollama)
    answer = _ollama_generate(prompt, model="llama3")

    # 8) If LLaMA returns nothing / says not found, try web fallback
    if not answer or "not found" in answer.lower():
        web_txt = _search_web(q)
        if web_txt:
            answer = "(No exact doc match — web)\n\n" + web_txt
        elif not answer:
            answer = "No relevant data found."

    # 9) Prepare results & cache
    results = [
        {
            "similarity": round(t["sim"], 4),
            "document_id": t["row"]["document_id"],
            "document_title": t["row"]["doc_title"],
            "authority": t["row"]["doc_authority"],
            "source_type": t["row"]["doc_source_type"],
            "chunk_index": t["row"]["chunk_index"],
            "snippet": (
                t["row"]["chunk_text"][:800]
                + ("…" if len(t["row"]["chunk_text"]) > 800 else "")
            ),
        }
        for t in top
    ]

    memory_cache.append({"q": q, "a": answer})
    if len(memory_cache) > 24:
        memory_cache.pop(0)

    return {
        "question": q,
        "answer": answer,
        "source": "db" if best_sim >= 0.40 else "web",
        "results": results,
    }
