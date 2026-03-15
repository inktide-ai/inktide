"""API endpoint tests."""
import pytest


def test_health_returns_ok_when_ready(client):
    """Health returns 200 when model is loaded."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["ready"] is True


def test_health_returns_503_when_not_ready(client):
    """Health returns 503 when model is not loaded."""
    from unittest.mock import patch

    with patch("app.api.routes.health.is_model_ready", return_value=False):
        response = client.get("/api/v1/health")
    assert response.status_code == 503
    data = response.json()
    assert data["ready"] is False


def test_embed_single(client):
    """Embed returns vector for single text."""
    response = client.post(
        "/api/v1/embed",
        json={"text": "Hello world"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "embedding" in data
    assert "dim" in data
    assert len(data["embedding"]) == data["dim"]
    assert data["dim"] == 384


def test_embed_rejects_empty_text(client):
    """Embed returns 400 for empty text."""
    response = client.post(
        "/api/v1/embed",
        json={"text": "   "},
    )
    assert response.status_code == 400


def test_embed_batch(client):
    """Embed batch returns vectors for multiple texts."""
    response = client.post(
        "/api/v1/embed/batch",
        json={"texts": ["a", "b", "c"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert "embeddings" in data
    assert len(data["embeddings"]) == 3
    assert all(len(e) == 384 for e in data["embeddings"])
    assert data["dim"] == 384


def test_embed_batch_rejects_empty_list(client):
    """Embed batch returns 400 for empty texts list."""
    response = client.post(
        "/api/v1/embed/batch",
        json={"texts": []},
    )
    assert response.status_code == 400


def test_classify_with_custom_categories(client):
    """Classify returns best category and scores."""
    response = client.post(
        "/api/v1/classify",
        json={
            "text": "playing video games",
            "categories": {
                "gaming": ["game", "stream", "twitch"],
                "work": ["code", "meeting", "deadline"],
            },
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "category" in data
    assert "score" in data
    assert "scores" in data
    assert data["category"] in ("gaming", "work")
    assert data["category"] in data["scores"]
    assert 0 <= data["score"] <= 1


def test_classify_rejects_empty_text(client):
    """Classify returns 400 for empty text."""
    response = client.post(
        "/api/v1/classify",
        json={"text": "   ", "categories": {"a": ["x"]}},
    )
    assert response.status_code == 400


def test_classify_rejects_empty_categories(client):
    """Classify returns 400 for empty categories."""
    response = client.post(
        "/api/v1/classify",
        json={"text": "hello", "categories": {}},
    )
    assert response.status_code == 400
