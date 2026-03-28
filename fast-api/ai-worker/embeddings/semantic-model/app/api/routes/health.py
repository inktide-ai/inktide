from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.embeddings import is_model_ready

router = APIRouter()


@router.get("/health")
def health():
    """Health check for monitoring and load balancers."""
    if not is_model_ready():
        return JSONResponse(
            status_code=503,
            content={"status": "starting", "ready": False},
        )
    return {"status": "ok", "ready": True}
