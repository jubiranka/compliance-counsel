"""
Draft Generation API
--------------------
This endpoint is used by the frontend "Generate Draft" button.
It generates a CS-grade draft (resolution, notice, filing, etc.)
for the selected compliance.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx, os

router = APIRouter(prefix="/drafts", tags=["Draft Generation"])

# You can modify this if your Ollama or LLM URL differs
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://host.docker.internal:11434/api/generate")

class DraftRequest(BaseModel):
    compliance_id: int
    compliance_title: str

class DraftResponse(BaseModel):
    draft_text: str


@router.post("/generate", response_model=DraftResponse)
async def generate_draft(req: DraftRequest):
    """
    Generate a CS-grade draft for the given compliance.
    """
    prompt = f"""
    You are an Indian Company Secretary.
    Generate a professional, CS-grade draft for the compliance:
    "{req.compliance_title}" under the applicable company law.
    Include the proper structure, references, and filing language.
    """

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            resp = await client.post(
                OLLAMA_URL,
                json={"model": "llama3", "prompt": prompt, "stream": False},
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Model request failed: {resp.status_code} - {resp.text}",
                )
            data = resp.json()
            draft_text = data.get("response") or "No draft generated."
            return {"draft_text": draft_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Draft generation failed: {e}")
