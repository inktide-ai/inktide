"""Pytest fixtures — mock Ollama to avoid real network calls."""
import json
from unittest.mock import patch

import numpy as np
import pytest
from fastapi.testclient import TestClient

EMBEDDING_DIM = 384

MOCK_FACTS = [
    {
        "text": "Steve_TTV prefers building with red bricks",
        "type": "preference",
        "entities": ["Steve_TTV", "red bricks"],
        "importance": 0.7,
    },
]


class MockOllamaEmbeddings:
    def __init__(self, *_a, **_kw):
        pass

    def encode(self, texts, **_kw):
        if isinstance(texts, str):
            return np.full(EMBEDDING_DIM, 0.1, dtype=np.float32)
        return np.full((len(texts), EMBEDDING_DIM), 0.1, dtype=np.float32)

    def close(self):
        pass


class MockOllamaChat:
    def __init__(self, *_a, **_kw):
        pass

    def chat(self, messages, **_kw):
        return json.dumps({"facts": MOCK_FACTS})

    def generate(self, prompt, **_kw):
        return "OK"

    def ping(self):
        return True

    def close(self):
        pass


@pytest.fixture(autouse=True)
def _reset_singletons():
    """Reset module-level singletons between tests."""
    import app.services.embeddings as emb
    import app.services.fact_extraction as facts

    orig_emb, orig_chat = emb._model, facts._chat_client
    emb._model = None
    facts._chat_client = None
    emb._cached_encode.cache_clear()
    yield
    emb._model = orig_emb
    facts._chat_client = orig_chat


@pytest.fixture(autouse=True)
def _mock_ollama():
    """Replace Ollama clients with fakes so tests run without a server."""
    with (
        patch("app.services.embeddings.OllamaEmbeddings", MockOllamaEmbeddings),
        patch("app.services.fact_extraction.OllamaChat", MockOllamaChat),
    ):
        yield


@pytest.fixture
def client():
    from app.main import app

    with TestClient(app) as c:
        yield c
