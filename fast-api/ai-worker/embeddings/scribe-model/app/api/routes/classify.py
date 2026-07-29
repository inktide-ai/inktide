"""Semantic classification by similarity to category examples."""
import asyncio
import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.models import ClassifyRequest, ClassifyResponse
from app.services.embeddings import classify_by_similarity

router = APIRouter()

_CATEGORIES_PATH = Path(__file__).resolve().parents[3] / "data" / "stream_categories.json"


@lru_cache(maxsize=1)
def _load_default_categories() -> dict[str, list[str]]:
    """Load and cache default stream categories from disk (called once)."""
    if not _CATEGORIES_PATH.exists():
        raise FileNotFoundError(_CATEGORIES_PATH)
    with open(_CATEGORIES_PATH, encoding="utf-8") as f:
        return json.load(f)


@router.post("", response_model=ClassifyResponse)
@router.post("/", response_model=ClassifyResponse)
async def classify(request: ClassifyRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if request.categories is not None:
        categories = request.categories
    else:
        try:
            categories = _load_default_categories()
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Default categories not found. "
                    "Run: python scripts/extract_twitch_categories.py"
                ),
            ) from exc

    if not categories:
        raise HTTPException(status_code=400, detail="Categories cannot be empty")

    category, score, scores = await asyncio.to_thread(
        classify_by_similarity, request.text, categories,
    )
    return ClassifyResponse(category=category, score=score, scores=scores)
