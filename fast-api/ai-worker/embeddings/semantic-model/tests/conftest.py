"""Pytest fixtures. Mock model to avoid loading real weights in tests."""
from unittest.mock import patch

import numpy as np
import pytest
from fastapi.testclient import TestClient


class MockModel:
    """Fake SentenceTransformer for tests."""

    def __init__(self, *args, **kwargs):
        pass

    def encode(self, texts, convert_to_numpy=True, **kwargs):
        if isinstance(texts, str):
            return np.array([0.1] * 384, dtype=np.float32)
        return np.array([[0.1] * 384] * len(texts), dtype=np.float32)

    def encode_document(self, texts, convert_to_numpy=True, **kwargs):
        return self.encode(texts, convert_to_numpy, **kwargs)

    def encode_query(self, texts, convert_to_numpy=True, **kwargs):
        out = self.encode(texts, convert_to_numpy, **kwargs)
        return out[0] if out.ndim == 2 and out.shape[0] == 1 else out


@pytest.fixture(autouse=True)
def mock_sentence_transformer():
    """Replace SentenceTransformer with MockModel so tests run without downloading."""
    with patch("app.services.embeddings.SentenceTransformer", MockModel):
        yield


@pytest.fixture
def client():
    """Test client with mocked model. Use context manager so lifespan runs."""
    from app.main import app
    with TestClient(app) as c:
        yield c
