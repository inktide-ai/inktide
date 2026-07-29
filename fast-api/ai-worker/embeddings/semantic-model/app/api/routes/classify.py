"""Semantic classification by similarity to category examples."""
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.models import ClassifyRequest, ClassifyResponse
from app.services.embeddings import classify_by_similarity

router = APIRouter()

DEFAULT_CATEGORIES_PATH = Path(__file__).resolve().parents[3] / "data" / "stream_categories.json"


def _load_default_categories() -> dict[str, list[str]]:
    if not DEFAULT_CATEGORIES_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="Default categories not found. Run: python scripts/extract_twitch_categories.py",
        )
    with open(DEFAULT_CATEGORIES_PATH, encoding="utf-8") as f:
        return json.load(f)


@router.post("", response_model=ClassifyResponse)
@router.post("/", response_model=ClassifyResponse)
def classify(request: ClassifyRequest):
    """Classify text by semantic similarity to category examples."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    categories = (
        request.categories if request.categories is not None else _load_default_categories()
    )
    if not categories:
        raise HTTPException(status_code=400, detail="Categories cannot be empty")

    category, score, scores = classify_by_similarity(request.text, categories)
    return ClassifyResponse(category=category, score=score, scores=scores)
