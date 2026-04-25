# Inktide

**Inktide** — AI-стример. Слушает Discord и Twitch чат, думает, отвечает голосом — в реальном времени, пока идёт стрим.

Не чат-бот. Не скрипт. Персонаж с памятью, голосом и реакцией на аудиторию.

---

## Как это работает

Пользователь пишет в чат. Через 1–4 секунды стример отвечает голосом.

```
Discord / Twitch
      │
      ▼
  Ingest          — активен ли канал? rate limit? sampling?
      │
      ▼
  Redis Stream    — очередь synapse.ingest
      │
      ▼
  Pipeline        — контекст (история + RAG + AiCard конфиг)
                  — vLLM генерирует ответ (streaming)
                  — TTS синтезирует первые слова ПАРАЛЛЕЛЬНО с LLM
      │
      ▼
  Publisher       — Twitch / Discord WebSocket
```

**Latency budget:**

```
  0 –   50ms   Ingest: проверки, фильтрация
 50 –  200ms   Pipeline: сборка контекста (Redis + Qdrant + DB параллельно)
200 – 3000ms   vLLM: генерация (75% бюджета — GPU bottleneck)
500 – 1300ms   TTS: синтез первого предложения (параллельно с хвостом LLM)

Голос звучит через ~1300ms после сообщения.
```

Ключевое решение: TTS стартует на первом предложении от LLM, пока LLM ещё генерирует остаток. Это даёт ~800ms выигрыша без каких-либо трюков.

---

## Структура репозитория

```
inktide/
├── src/                        .NET 10 — API host + bounded contexts
│   ├── Inktide.API/            — host, module system, DI
│   ├── Inktide.API.Connector/  — Discord / Twitch ingest → Redis Stream
│   ├── Inktide.API.Synapse/    — pipeline orchestration (scatter-gather)
│   ├── Inktide.API.Soul/       — AiCard управление, gRPC, S3 модели
│   ├── Inktide.API.Memory/     — RAG: Qdrant + Ollama embeddings + Scribe
│   ├── Inktide.API.TTS/        — Kokoro TTS, streaming synthesis
│   ├── Inktide.API.Realtime/   — SignalR AudioHub (браузерный микрофон)
│   ├── Inktide.API.Profile/    — пользователи, Keycloak Admin API, MinIO
│   └── Inktide.API.Core/       — shared kernel
│
├── apps/
│   ├── web/                    React 18 / Vite / TypeScript
│   └── desktop/                Tauri desktop app
│
├── fast-api/
│   ├── ai-worker/              Python — Ollama embeddings + classify
│   └── ai-worker/scribe/       факт-экстракция для Memory (port 8001)
│
├── crates/                     Rust — медиа, аудио, анимация, lipsync
├── assets/models/              прототипные VRM / GLB модели
└── docs/                       архитектурные решения
```

---

## Технологический стек

| Слой | Технология | Зачем |
|------|-----------|-------|
| Transport | Redis Streams | Consumer groups, ACK, XCLAIM, retention — всё что нужно, без Kafka |
| LLM | vLLM + Mistral / любая OpenAI-совместимая | Continuous batching, горизонтальный скейлинг = +GPU |
| TTS | Kokoro | Streaming synthesis, низкая latency |
| Embeddings | Ollama (nomic-embed-text) | Локально, без внешних API |
| Векторный поиск | Qdrant | RAG — релевантные воспоминания из истории |
| База данных | PostgreSQL | AiCards, конфиг, аналитика |
| Кэш / rate limit | Redis 7 | Token bucket (Lua, атомарно), session history, backpressure |
| Auth | Keycloak | OIDC, Twitch provider, кастомная тема |
| Storage | MinIO (S3) | VRM модели, аватары |
| Observability | OpenTelemetry + Prometheus + Grafana | traceId от Ingest до Publisher |

---

## Bounded Contexts (.NET)

Архитектура следует DDD / Hexagonal. Каждый контекст — отдельный набор проектов:

```
Inktide.API.{Context}.Domain         — сущности, репозитории (порты)
Inktide.API.{Context}.Application    — use cases, интерфейсы сервисов
Inktide.API.{Context}.Infrastructure — адаптеры (HTTP, DB, Redis, внешние API)
Inktide.API.{Context}.REST           — контроллеры, валидация, DI wiring
```

Главный хост загружает модули через reflection по списку в `appsettings.json`. Контейнер — DryIoc, с бриджом к MS DI для ASP.NET Core.

---

## Быстрый старт

### Инфраструктура

```bash
docker compose up -d
# Postgres, Keycloak (8080), Redis (6379), MinIO (9000/9001)
```

### .NET Backend

```bash
dotnet build Inktide.API.sln
dotnet run --project src/Inktide.API
```

### Web

```bash
cd apps/web
npm install
npm run dev   # http://localhost:5173
```

### Python Workers

```bash
cd fast-api/ai-worker
pip install -r requirements.txt
uvicorn main:app --port 8000

cd fast-api/ai-worker/scribe
uvicorn main:app --port 8001
```

---

## Конфигурация

Секреты помечены `CHANGE_ME__*` в `appsettings.json`. Поставить через user secrets:

```bash
dotnet user-secrets --id f50fcecb-9d6a-45bd-91ea-b8e4886bebf2 set "Postgres:Password" "..."
```

Основные сервисы и их дефолты:

| Сервис | Адрес |
|--------|-------|
| API (Kestrel) | `127.0.0.1:5000` |
| Keycloak | `localhost:8080` |
| Redis | `localhost:6379` |
| PostgreSQL | `localhost:5432` |
| vLLM / Ollama | `localhost:11434` |
| Qdrant | `localhost:6334` (gRPC) |
| Kokoro TTS | `localhost:8880` |
| MinIO | `localhost:9000` |

---

## Масштабирование

Единственный реальный bottleneck — GPU.

```
+1 GPU = +1 vLLM инстанс = +1 Pipeline Worker = +throughput

Ingest / Publisher — stateless, скейлятся тривиально.
Redis / PostgreSQL / Qdrant — не bottleneck при типичной нагрузке.
```

Подробнее о принципах и решениях: [docs/SYNAPSE_ARCHITECTURE_RETHINK.md](docs/SYNAPSE_ARCHITECTURE_RETHINK.md)

---

## AiCard

Центральная сущность. Описывает AI-персонажа:
- system prompt — личность, стиль речи, тематика
- LLM модель
- TTS голос
- VRM / GLB аватар
- привязка к каналу (Twitch / Discord)
- лимит воспоминаний (RAG)

Управляется через Soul API (REST + gRPC на порту 8084).

---

## Observability

Три ключевые метрики:

```
synapse_e2e_latency_ms         — от сообщения до голоса. SLO: p95 < 4000ms
synapse_context_degraded_rate  — % без истории или RAG. Алерт: > 5%
synapse_gpu_queue_depth        — очередь к vLLM. Алерт: > 200 за 2 минуты → нужен GPU
```

traceId живёт от Connector (Ingest) до Publisher. W3C TraceContext через Redis Stream headers.
