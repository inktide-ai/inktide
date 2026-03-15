# Chimera Scribe Model

REST API for **conversation memory** — extracts facts, generates embeddings, and classifies text using **Qwen 2.5** via **Ollama**.

---

## Features

- **Fact extraction** — extract memorable facts from conversation turns using LLM
- **Embeddings** — single and batch text embedding via Ollama
- **Classification** — semantic classification by cosine similarity to category examples
- **Async-ready** — non-blocking I/O on all Ollama calls (`asyncio.to_thread`)

---

## Requirements

- Python 3.10+
- [Ollama](https://ollama.com) running locally or in Docker
- Qwen 2.5 model pulled: `ollama pull qwen2.5`

---

## Quick Start

```bash
ollama pull qwen2.5

pip install -r requirements.txt

uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API

| Method | Endpoint                | Description                          |
|--------|-------------------------|--------------------------------------|
| `GET`  | `/api/v1/health`        | Health check (embeddings + chat)     |
| `POST` | `/api/v1/extract-facts` | Extract facts from conversation turn |
| `POST` | `/api/v1/embed`         | Single text embedding                |
| `POST` | `/api/v1/embed/batch`   | Batch embeddings                     |
| `POST` | `/api/v1/classify`      | Semantic classification              |

### Extract Facts

```bash
curl -X POST http://localhost:8000/api/v1/extract-facts \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": {"sender": "Steve_TTV", "text": "я люблю строить из красного кирпича"},
    "botResponse": "О, красный кирпич? Отличный выбор!",
    "platform": "twitch",
    "gameState": {"activity": "building", "biome": "plains"}
  }'
```

Response:

```json
{
  "facts": [
    {
      "text": "Steve_TTV prefers building with red bricks",
      "type": "preference",
      "entities": ["Steve_TTV", "red bricks"],
      "importance": 0.7
    }
  ]
}
```

### Embed

```bash
curl -X POST http://localhost:8000/api/v1/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "Text to vectorize"}'
```

### Classify

```bash
curl -X POST http://localhost:8000/api/v1/classify \
  -H "Content-Type: application/json" \
  -d '{
    "text": "играю в доту",
    "categories": {
      "gaming": ["game", "stream", "twitch"],
      "work": ["code", "meeting", "deadline"]
    }
  }'
```

---

## Configuration

Copy `.env.example` → `.env`:

| Variable             | Default                    | Description                |
|----------------------|----------------------------|----------------------------|
| `OLLAMA_BASE_URL`    | `http://localhost:11434`   | Ollama server URL          |
| `OLLAMA_CHAT_MODEL`  | `qwen2.5`                 | Model for fact extraction  |
| `OLLAMA_EMBED_MODEL` | `qwen2.5`                 | Model for embeddings       |
| `OLLAMA_TIMEOUT`     | `120`                      | Request timeout (seconds)  |
| `HOST`               | `0.0.0.0`                 | Server bind host           |
| `PORT`               | `8000`                     | Server bind port           |

---

## Docker

```bash
docker compose up -d

# Pull the model into the Ollama container (first time only)
docker exec -it <ollama-container> ollama pull qwen2.5
```

---

## Development

```bash
pip install -e ".[dev]"
pytest tests/ -v
```

---

## License

Proprietary. Chimera.
