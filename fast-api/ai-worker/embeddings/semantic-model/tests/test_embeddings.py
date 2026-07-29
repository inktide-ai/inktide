"""Unit tests for embeddings service."""
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from app.services.embeddings import (
    _encode,
    embed_batch,
    embed_single,
    get_embeddings_service,
    is_model_ready,
    warm_up_model,
)


class FakeModel:
    """Minimal mock for encode tests. Accepts model_name, token, etc."""

    def __init__(self, model_name_or_path="", **kwargs):
        pass

    def encode(self, texts, convert_to_numpy=True, **kwargs):
        if isinstance(texts, str):
            return np.array([0.1] * 384, dtype=np.float32)
        return np.array([[0.1] * 384] * len(texts), dtype=np.float32)

    def encode_document(self, texts, convert_to_numpy=True, **kwargs):
        return self.encode(texts, convert_to_numpy, **kwargs)

    def encode_query(self, texts, convert_to_numpy=True, **kwargs):
        out = self.encode(texts, convert_to_numpy, **kwargs)
        return out[0] if isinstance(texts, str) else out


@pytest.fixture(autouse=True)
def reset_model():
    """Reset global model state between tests."""
    import app.services.embeddings as mod
    original = mod._model
    mod._model = None
    yield
    mod._model = original


def test_warm_up_loads_model():
    """warm_up_model loads and caches the model."""
    with patch("app.services.embeddings.SentenceTransformer", FakeModel):
        assert not is_model_ready()
        warm_up_model()
        assert is_model_ready()
        model = get_embeddings_service()
        assert model is not None


def test_embed_single_returns_vector():
    """embed_single returns 1D numpy array."""
    with patch("app.services.embeddings.SentenceTransformer", FakeModel):
        warm_up_model()
        result = embed_single("hello")
        assert isinstance(result, np.ndarray)
        assert result.ndim == 1
        assert len(result) == 384


def test_embed_batch_returns_list_of_vectors():
    """embed_batch returns list of vectors."""
    with patch("app.services.embeddings.SentenceTransformer", FakeModel):
        warm_up_model()
        result = embed_batch(["a", "b", "c"])
        assert len(result) == 3
        assert all(isinstance(v, np.ndarray) and v.ndim == 1 for v in result)
        assert all(len(v) == 384 for v in result)


def test_encode_fallback_for_models_without_encode_document():
    """_encode uses model.encode when encode_document is missing."""
    model = MagicMock(spec=["encode"])
    model.encode.return_value = np.array([0.1] * 384)

    out = _encode(model, "test", as_document=True)
    assert out is not None
    model.encode.assert_called_once()
