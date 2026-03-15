from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.embeddings import is_model_ready
from app.services.fact_extraction import is_chat_ready

router = APIRouter()


@router.get("/health")
async def health():
    embed_ok = is_model_ready()
    chat_ok = is_chat_ready()
    ready = embed_ok and chat_ok

    body = {
        "status": "ok" if ready else "starting",
        "ready": ready,
        "services": {"embeddings": embed_ok, "chat": chat_ok},
    }
    if not ready:
        return JSONResponse(status_code=503, content=body)
    return body
