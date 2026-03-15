import asyncio

from fastapi import APIRouter, HTTPException

from app.models import (
    EmbedBatchRequest,
    EmbedBatchResponse,
    EmbedRequest,
    EmbedResponse,
)
from app.services.embeddings import embed_batch as svc_embed_batch
from app.services.embeddings import embed_single

router = APIRouter()


@router.post("", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    embedding = await asyncio.to_thread(embed_single, request.text)
    return EmbedResponse(embedding=embedding.tolist(), dim=len(embedding))


@router.post("/batch", response_model=EmbedBatchResponse)
async def embed_batch(request: EmbedBatchRequest):
    if not request.texts:
        raise HTTPException(status_code=400, detail="Texts list cannot be empty")
    embeddings = await asyncio.to_thread(svc_embed_batch, request.texts)
    dim = len(embeddings[0]) if embeddings else 0
    return EmbedBatchResponse(
        embeddings=[e.tolist() for e in embeddings],
        dim=dim,
    )
