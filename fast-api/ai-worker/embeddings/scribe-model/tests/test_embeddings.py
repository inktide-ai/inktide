"""Unit tests for the embeddings service layer."""
import numpy as np
from app.services.embeddings import (
    embed_batch,
    embed_single,
    get_embeddings_service,
    is_model_ready,
    warm_up_model,
)


def test_warm_up_loads_model():
    assert not is_model_ready()
    warm_up_model()
    assert is_model_ready()
    assert get_embeddings_service() is not None


def test_embed_single_returns_1d():
    warm_up_model()
    out = embed_single("hello")
    assert isinstance(out, np.ndarray)
    assert out.ndim == 1


def test_embed_batch_returns_list():
    warm_up_model()
    out = embed_batch(["a", "b", "c"])
    assert len(out) == 3
    assert all(isinstance(v, np.ndarray) and v.ndim == 1 for v in out)
