"""API endpoint integration tests."""
from unittest.mock import patch


def test_health_ok(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["ready"] is True
    assert body["services"]["embeddings"] is True
    assert body["services"]["chat"] is True


def test_health_503_when_not_ready(client):
    with patch("app.api.routes.health.is_model_ready", return_value=False):
        r = client.get("/api/v1/health")
    assert r.status_code == 503
    assert r.json()["ready"] is False




def test_embed_single(client):
    r = client.post("/api/v1/embed", json={"text": "hello"})
    assert r.status_code == 200
    data = r.json()
    assert len(data["embedding"]) == data["dim"] == 384


def test_embed_rejects_blank(client):
    assert client.post("/api/v1/embed", json={"text": "  "}).status_code == 400


def test_embed_batch(client):
    r = client.post("/api/v1/embed/batch", json={"texts": ["a", "b"]})
    assert r.status_code == 200
    assert len(r.json()["embeddings"]) == 2


def test_embed_batch_rejects_empty(client):
    assert client.post("/api/v1/embed/batch", json={"texts": []}).status_code == 400




def test_classify(client):
    r = client.post(
        "/api/v1/classify",
        json={
            "text": "playing games",
            "categories": {
                "gaming": ["game", "stream"],
                "work": ["code", "meeting"],
            },
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["category"] in ("gaming", "work")
    assert 0 <= data["score"] <= 1


def test_classify_rejects_blank(client):
    r = client.post("/api/v1/classify", json={"text": "  ", "categories": {"a": ["x"]}})
    assert r.status_code == 400


def test_classify_rejects_empty_categories(client):
    r = client.post("/api/v1/classify", json={"text": "hello", "categories": {}})
    assert r.status_code == 400




def test_extract_facts(client):
    r = client.post(
        "/api/v1/extract-facts",
        json={
            "userMessage": {"sender": "Steve_TTV", "text": "я люблю строить из красного кирпича"},
            "botResponse": "О, красный кирпич? Отличный выбор!",
            "platform": "twitch",
            "channelId": "channel123",
            "timestamp": "2026-03-10T15:30:00Z",
            "gameState": {"activity": "building", "biome": "plains"},
        },
    )
    assert r.status_code == 200
    facts = r.json()["facts"]
    assert len(facts) >= 1
    f = facts[0]
    assert f["type"] in ("fact", "preference", "event", "relationship", "opinion", "skill")
    assert 0.0 <= f["importance"] <= 1.0


def test_extract_facts_minimal(client):
    r = client.post(
        "/api/v1/extract-facts",
        json={
            "userMessage": {"sender": "user1", "text": "hello"},
            "botResponse": "hi there",
        },
    )
    assert r.status_code == 200
    assert "facts" in r.json()


def test_extract_facts_rejects_blank_user(client):
    r = client.post(
        "/api/v1/extract-facts",
        json={"userMessage": {"sender": "u", "text": "  "}, "botResponse": "hi"},
    )
    assert r.status_code == 400


def test_extract_facts_rejects_blank_bot(client):
    r = client.post(
        "/api/v1/extract-facts",
        json={"userMessage": {"sender": "u", "text": "hello"}, "botResponse": "  "},
    )
    assert r.status_code == 400
