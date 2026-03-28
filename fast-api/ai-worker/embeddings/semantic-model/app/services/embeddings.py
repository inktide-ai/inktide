from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.services.ollama_client import OllamaEmbeddings

_model: SentenceTransformer | OllamaEmbeddings | None = None


def is_model_ready() -> bool:
    """Return True if model is loaded and ready for inference."""
    return _model is not None


def warm_up_model() -> None:
    """Load model at startup. Call from app lifespan."""
    get_embeddings_service()


def get_embeddings_service() -> SentenceTransformer | OllamaEmbeddings:
    global _model
    if _model is None:
        if settings.OLLAMA_BASE_URL:
            client = OllamaEmbeddings(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.EMBEDDING_MODEL,
            )
            client.encode("warmup")  # Load model in Ollama on first request
            _model = client
        else:
            import os

            if settings.HF_ENDPOINT:
                os.environ["HF_ENDPOINT"] = settings.HF_ENDPOINT
            kwargs = {}
            if settings.HF_TOKEN:
                kwargs["token"] = settings.HF_TOKEN
            _model = SentenceTransformer(settings.EMBEDDING_MODEL, **kwargs)
    return _model


def _encode(
    model: SentenceTransformer | OllamaEmbeddings,
    texts: str | list[str],
    as_document: bool = True,
):
    """Encode text(s). EmbeddingGemma uses encode_query/encode_document for best results."""
    if hasattr(model, "encode_document") and hasattr(model, "encode_query"):
        if as_document:
            out = model.encode_document(texts, convert_to_numpy=True)
        else:
            out = model.encode_query(texts, convert_to_numpy=True)
    else:
        out = model.encode(texts, convert_to_numpy=True)
    return out


def embed_single(text: str):
    model = get_embeddings_service()
    out = _encode(model, text, as_document=True)
    return out if out.ndim == 1 else out[0]


def embed_batch(texts: list[str]):
    model = get_embeddings_service()
    result = _encode(model, texts, as_document=True)
    return [result[i] for i in range(len(texts))]


def classify_by_similarity(text: str, categories: dict[str, list[str]]) -> tuple[str, float, dict[str, float]]:
    """
    Classify text by semantic similarity to category examples.
    Returns (best_category, best_score, all_scores).
    Uses encode_query for text, encode_document for examples (EmbeddingGemma dual-encoder).
    """
    import numpy as np

    model = get_embeddings_service()
    text_emb = _encode(model, text, as_document=False)  # query
    if text_emb.ndim > 1:
        text_emb = text_emb[0]

    scores: dict[str, float] = {}
    for category, examples in categories.items():
        if not examples:
            scores[category] = 0.0
            continue
        ex_embs = _encode(model, examples, as_document=True)
        # Cosine similarity: average over examples
        sims = np.dot(ex_embs, text_emb) / (
            np.linalg.norm(ex_embs, axis=1) * np.linalg.norm(text_emb)
        )
        scores[category] = float(np.mean(sims))

    best = max(scores.items(), key=lambda x: x[1])
    return best[0], best[1], scores
