"""Embedding and similarity services backed by Ollama."""
from __future__ import annotations

import logging
from functools import lru_cache

import numpy as np

from app.core.config import settings
from app.services.ollama_client import OllamaEmbeddings

logger = logging.getLogger(__name__)

_model: OllamaEmbeddings | None = None




def is_model_ready() -> bool:
    return _model is not None


def warm_up_model() -> None:
    """Load the embedding model into Ollama's memory."""
    try:
        svc = get_embeddings_service()
        svc.encode("warmup")
        logger.info("Embedding model ready (%s)", settings.OLLAMA_EMBED_MODEL)
    except Exception:
        logger.exception("Failed to warm up embedding model — Ollama may be unavailable")
        raise


def shutdown() -> None:
    global _model
    if _model is not None:
        _model.close()
        _model = None
    _cached_encode.cache_clear()
    _cached_encode_normalized.cache_clear()


def get_embeddings_service() -> OllamaEmbeddings:
    global _model
    if _model is None:
        _model = OllamaEmbeddings(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_EMBED_MODEL,
            timeout=settings.OLLAMA_TIMEOUT,
        )
    return _model




def embed_single(text: str) -> np.ndarray:
    out = get_embeddings_service().encode(text)
    return out[0] if out.ndim > 1 else out


def embed_batch(texts: list[str]) -> list[np.ndarray]:
    result = get_embeddings_service().encode(texts)
    return [result[i] for i in range(len(texts))]


def classify_by_similarity(
    text: str,
    categories: dict[str, list[str]],
) -> tuple[str, float, dict[str, float]]:
    """Classify *text* by cosine similarity to category examples.

    Returns ``(best_category, best_score, all_scores)``.
    """
    text_emb = embed_single(text)
    text_norm = np.linalg.norm(text_emb) + 1e-9

    scores: dict[str, float] = {}
    for category, examples in categories.items():
        if not examples:
            scores[category] = 0.0
            continue
        ex_embs_n = _cached_encode_normalized(tuple(examples))
        scores[category] = float(np.mean(ex_embs_n @ text_emb) / text_norm)

    best = max(scores.items(), key=lambda x: x[1])
    return best[0], best[1], scores




@lru_cache(maxsize=64)
def _cached_encode(texts: tuple[str, ...]) -> np.ndarray:
    """Encode a tuple of texts, caching by content to avoid re-encoding
    the same category examples on every classify request."""
    return get_embeddings_service().encode(list(texts))


@lru_cache(maxsize=64)
def _cached_encode_normalized(texts: tuple[str, ...]) -> np.ndarray:
    """Like _cached_encode but returns row-normalized embeddings so per-category
    norms are not recomputed on every classify call."""
    embs = get_embeddings_service().encode(list(texts))
    norms = np.linalg.norm(embs, axis=1, keepdims=True)
    return embs / (norms + 1e-9)
