# Inktide Semantic Model

REST API for semantic text processing: embeddings and classification in real time.

---

## Features

- **Embeddings** — convert text to vector representations (384/768 dim)
- **Batch embeddings** — process multiple texts in one request
- **Semantic classification** — classify by meaning with custom categories
- **Stream-ready** — tuned for chat messages and stream logs

---

## Requirements

- Python 3.10+
- 2 GB RAM (4 GB recommended for larger models)

---

## Quick Start

```bash
# Install
pip install -r requirements.txt

# Run
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

API runs at `http://localhost:8000`. Interactive docs: `/docs`.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/embed` | Single text embedding |
| POST | `/api/v1/embed/batch` | Batch embeddings |
| POST | `/api/v1/classify` | Semantic classification |

### Embed

```bash
curl -X POST "http://localhost:8000/api/v1/embed" \
  -H "Content-Type: application/json" \
  -d '{"text": "Text to vectorize"}'
```

### Batch Embed

```bash
curl -X POST "http://localhost:8000/api/v1/embed/batch" \
  -H "Content-Type: application/json" \
  -d '{"texts": ["text 1", "text 2", "text 3"]}'
```

### Classify

Classify text by semantic similarity to category examples. Supports custom categories or built-in ones (gaming, work, casual, music).

```bash
curl -X POST "http://localhost:8000/api/v1/classify" \
  -H "Content-Type: application/json" \
  -d '{"text": "Message to classify"}'
```

---

## Configuration

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Description | Default |
|----------|-------------|---------|
| `EMBEDDING_MODEL` | Hugging Face model ID or local path | `sentence-transformers/all-MiniLM-L6-v2` |
| `HF_TOKEN` | Hugging Face token (for gated models) | — |
| `HF_ENDPOINT` | Hugging Face mirror URL | — |
| `OLLAMA_BASE_URL` | Ollama server URL (use instead of HF) | — |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |

### Supported Models

| Model | Dimensions | Notes |
|-------|------------|-------|
| `sentence-transformers/all-MiniLM-L6-v2` | 384 | Default, no auth required |
| `sentence-transformers/paraphrase-MiniLM-L3-v2` | 384 | Faster, smaller |
| `google/embeddinggemma-300m` | 768 | Multilingual, gated (token or mirror) |

### EmbeddingGemma when Hugging Face is blocked

1. **Ollama** (recommended) — Ollama uses different CDNs and often works when HF does not:
   ```bash
   # Install Ollama from https://ollama.com
   ollama pull embeddinggemma:300m
   ```
   In `.env`:
   ```
   OLLAMA_BASE_URL=http://localhost:11434
   EMBEDDING_MODEL=embeddinggemma:300m
   ```

2. **HF mirror** — add to `.env`:
   ```
   EMBEDDING_MODEL=google/embeddinggemma-300m
   HF_ENDPOINT=https://hf-mirror.com
   HF_TOKEN=hf_xxx  # still needed for gated model
   ```

3. **Local path** — if you get the model from a friend or another network:
   ```
   EMBEDDING_MODEL=/path/to/embeddinggemma-300m
   ```

---

## Deployment

### Docker

```bash
docker build -t inktide-semantic-model .
docker run -p 8000:8000 inktide-semantic-model
```

### Docker Compose

```bash
docker compose up -d
```

---

## Category Setup for Classification

To use built-in categories (gaming, work, casual, music), generate the examples file:

```bash
pip install datasets
python scripts/extract_twitch_categories.py --gaming 200 --output data/stream_categories.json
```

---

## Tests

```bash
pip install -e ".[dev]"  # or: pip install pytest httpx
pytest tests/ -v
```

## License

Proprietary. Inktide.
