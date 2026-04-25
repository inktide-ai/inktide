# Inktide — Полная архитектурная карта проекта

## Что такое Inktide

Inktide — **AI-стриминговая платформа**: виртуальный AI-компаньон, который читает чат Discord/Twitch, отвечает голосом через TTS, показывает 3D/2D аватар с синхронизацией губ. Полностью SaaS: каждый пользователь приносит свои API-ключи (BYOK).

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| **Backend** | .NET 10, C#, ASP.NET Core, EF Core, gRPC |
| **Frontend** | React 18, Vite, TypeScript, React Router v6, i18next |
| **Desktop** | Tauri (Rust) |
| **Database** | PostgreSQL (основная), Redis (стримы + кэш), Qdrant (векторы) |
| **Auth** | Keycloak (OIDC/OAuth2), JWT, ASP.NET Core Data Protection |
| **LLM** | Semantic Kernel, любой OpenAI-compat (Ollama, OpenAI, Anthropic, DeepSeek, ...) |
| **TTS** | Kokoro (local), ElevenLabs, Cartesia, Fish Audio, Azure Speech, Google Cloud TTS |
| **AI Workers** | Python FastAPI (embeddings, fact extraction) |
| **Rendering** | Rust crates (lipsync, animation, audio, 3D rendering) |
| **Storage** | MinIO (S3-compat) |

---

## Репозиторий

```
inktide/
├── src/                    # .NET 10 решение (Inktide.API.sln)
├── apps/
│   ├── web/               # React 18 / Vite / TypeScript
│   └── desktop/           # Tauri desktop app
├── crates/                # Rust workspace (lipsync, audio, animation, rendering)
├── fast-api/              # Python FastAPI AI-воркеры
├── keycloak/              # Keycloak тема (React/Keycloakify) + Twitch провайдер (Java/Maven)
├── docs/                  # Архитектурная документация
└── docker-compose.yml     # Инфраструктура
```

---

## Инфраструктура (docker-compose.yml)

**Profile `core`** (обязательный):
| Сервис | Порт | Назначение |
|--------|------|-----------|
| `postgres` | 5432 | Основная БД приложения |
| `postgres-keycloak` | internal | БД для Keycloak |
| `keycloak` | 8080 | SSO/OAuth2 (realm `inktide`) |
| `redis` | 6379 | Redis Streams + кэш |
| `qdrant` | 6333/6334 | Векторная БД (semantic memory) |
| `minio` | 9000/9001 | S3-совместимое хранилище файлов |

**Profile `workers`** (опциональный):
| Сервис | Порт | Назначение |
|--------|------|-----------|
| `scribe` | 8001 | Извлечение фактов из диалогов (Python FastAPI) |
| `kokoro` | 8880 | Локальный TTS-движок |

**Ollama** запускается на хосте (`:11434`), доступен внутри контейнеров как `host.docker.internal:11434`.

---

## .NET Backend — Модульная система

### Точка входа
```
Program.cs → Startup.cs → App.cs
```

**Startup.cs** (`src/Inktide.API/Deployment/Startup.cs`):
- Читает секцию `Modules` из `appsettings.json`
- Загружает DLL через reflection
- Обнаруживает и вызывает все реализации интерфейсов:
  - `IStartup` → `ConfigureServices()` (регистрация DI)
  - `IEndpointConfigurator` → маппинг HTTP/gRPC endpoints
  - `IMiddlewareConfigurator` → настройка pipeline ASP.NET
  - `IWebHostConfigurator` → настройка Kestrel/хоста
- **DI**: DryIoc (основной) + MS DI (для ASP.NET), соединены через `DryIocServiceProviderFactory`

**appsettings.json — enabled modules:**
```
Connector.Infrastructure, Connector.Discord, Connector.InktideChat
Synapse.Infrastructure, Synapse.REST
Profile.Application/Infrastructure/REST
Soul.Application/Infrastructure/REST/Grpc/Grpc.AiCards.Service
TTS.Application/Infrastructure/REST
Memory.Infrastructure
Realtime.Infrastructure
```

---

## Bounded Contexts (DDD / Hexagonal)

Каждый контекст = набор проектов:
```
{Context}.Domain         → сущности, доменные исключения, интерфейсы репозиториев
{Context}.Application    → use cases, application interfaces, options/config
{Context}.Infrastructure → адаптеры (HTTP, DB, внешние API), DI composition root
{Context}.REST           → контроллеры, FluentValidation, IStartup+IEndpointConfigurator
{Context}.REST.Models    → HTTP DTOs
```

---

### Soul — Управление AI-картами и BYOK-ключами

**Расположение:** `src/Inktide.API.Soul/`

**Ответственность:** Создание, настройка и хранение AI-компаньонов (AiCard). Управление пользовательскими API-ключами (BYOK). Каталог LLM/TTS моделей.

**Ключевые сущности:**

| Сущность | Файл | Описание |
|----------|------|---------|
| `AiCard` | `Soul.Domain/Entities/AiCard.cs` | Основной агрегат: name, slug, systemPrompt, personality, JSONB-поля (llmConfig, ttsConfig, appearance, responseBehavior, memorySettings, autoPilot) |
| `LlmCatalogEntry` | `Soul.Domain/Entities/LlmCatalogEntry.cs` | Доступные модели (17 записей, засеяно миграцией): provider, modelId, displayName, tier |
| `UserProviderCredential` | `Soul.Domain/Entities/UserProviderCredential.cs` | BYOK-ключ: (userId, providerId) → зашифрованный API-ключ + опциональный baseUrl |
| `AiCardChannel` | `Soul.Domain/Entities/AiCardChannel.cs` | Привязки к платформам (Discord guild/channel) |
| `AiCardScene` | `Soul.Domain/Entities/AiCardScene.cs` | Фоновые изображения для аватара |
| `TtsCatalogEntry` | `Soul.Domain/Entities/TtsCatalogEntry.cs` | Доступные TTS-голоса |

**BYOK-шифрование:**
- `ApiKeyProtector` (`Soul.Infrastructure/Security/ApiKeyProtector.cs`) — обёртка над ASP.NET Core Data Protection
- Purpose string: `"inktide.llm-credentials.v1"` (версионировано для ротации ключей)
- `Protect(plainText)` / `Unprotect(cipherText)` — AES-256-CBC + HMAC

**REST API:**
| Endpoint | Контроллер | Описание |
|----------|-----------|---------|
| `GET/POST /api/soul/cards` | `AiCardsController` | CRUD карт |
| `GET/PUT/DELETE /api/soul/credentials/{providerId}` | `CredentialsController` | BYOK-ключи; plaintext никогда не возвращается |
| `GET /api/soul/catalog/llm-models` | `CatalogController` | Каталог LLM моделей |
| `GET /api/soul/catalog/tts-voices` | `CatalogController` | Каталог TTS голосов |
| `POST /api/soul/cards/{id}/avatar` | `AiCardsController` | Загрузка аватара (→ MinIO) |
| `POST /api/soul/cards/{id}/models/presign` | `AiCardModelsController` | Presigned URL для 3D-модели |
| `GET/POST /api/soul/cards/{id}/channels` | `AiCardChannelsController` | Привязка к Discord/Twitch |

**gRPC:** порт **8084** — `AiCardsGrpcService` — быстрые lookup'ы для Synapse scatter-shards (`GetAiCardByChannelId`)

**БД:** PostgreSQL, схема `soul`, EF Core migrations в `Soul.Infrastructure/Migrations/`

---

### Synapse — Оркестратор AI-пайплайна

**Расположение:** `src/Inktide.API.Synapse/`

**Ответственность:** Принимает входящие сообщения из Redis, параллельно собирает контекст (история, память, конфиг персонажа), отправляет в LLM, публикует ответ по частям.

**Паттерн scatter-gather:**

```
synapse.ingest (Redis Stream)
        ↓
ChatMessageStreamConsumer
        ↓
SynapseIngestOrchestrator
        ├── ChannelContextResolutionService  ← gRPC запрос в Soul (порт 8084)
        │   └─ разрешает AiCard по channel_id
        │
        ├── [SCATTER — параллельно]
        │   ├── SessionScatterShard    ← история диалога из Redis
        │   └── RagScatterShard        ← семантическая память из Qdrant (через Ollama embeddings)
        │
        └── SynapseAggregationService  ← fan-in, строит SynapseAggregatedEnvelope
                ↓
        synapse.llm.ready (Redis Stream)
                ↓
        LlmStreamWorker
```

**LlmStreamWorker** (`Synapse.Infrastructure/Messaging/LlmStreamWorker.cs`):
1. Читает `SynapseAggregatedEnvelope` из `synapse.llm.ready`
2. Ищет BYOK-ключ: `IUserProviderCredentialService.GetDecryptedAsync(userId, providerId)`
3. Создаёт `IChatCompletionService` через `ChatServiceFactoryRegistry` (паттерн Strategy)
4. Если BYOK нет → fallback на платформенный провайдер из Kernel (Ollama)
5. Стримит токены через SK → `SentenceAccumulator` накапливает предложения
6. Публикует каждое предложение в `synapse.llm.response` с полями: correlationId, text, sequenceNumber, isLast, TTS-метаданные
7. После завершения: обновляет историю в Redis + enqueue в MemoryIngestionWorker

**ChatServiceFactoryRegistry** (`Synapse.Infrastructure/Providers/ChatServiceFactoryRegistry.cs`):
- Singleton, хранит `IChatServiceFactory[]` отсортированных по `Priority` (desc)
- `Resolve(providerId)` → первая фабрика, чей `CanHandle(providerId)` = true
- `OpenAiCompatChatServiceFactory` (Priority=0) — catch-all для всех OpenAI-compat провайдеров
- Добавить новый провайдер = новый класс + строчка в DI. `LlmStreamWorker` не трогается.

**Redis Streams:**
| Stream | Consumer Group | Producer | Consumer |
|--------|---------------|---------|---------|
| `synapse.ingest` | `pipeline-workers` | Connector | SynapseIngestOrchestrator |
| `synapse.llm.ready` | `llm-workers` | SynapseAggregationService | LlmStreamWorker |
| `synapse.llm.response` | `tts-workers` | LlmStreamWorker | LlmResponseStreamConsumer (TTS) |
| `synapse.tts.ready` | — | TTS module | BrowserAudioPublisher (Realtime) |

---

### Connector — Ингестия сообщений с платформ

**Расположение:** `src/Inktide.API.Connector/`

**Ответственность:** Получает сообщения из Discord/Twitch, помещает в Redis Stream.

**Поток:**
```
Discord (Discord.Net Gateway WebSocket)
        ↓ MESSAGE_CREATE
DiscordConnector → DiscordMessageMapper
        ↓ ChatMessage
ChatMessageChannel (in-memory System.Threading.Channels, неблокирующий)
        ↓
RedisStreamPublisherWorker → XADD synapse.ingest
```

- `DiscordSettings`: BotToken, GuildIds[], ChannelIds[], IgnoreBots, MaxReconnectAttempts
- `ChatMessage`: Sender (username, id), channelId, channelName, platformId, text, timestamp

---

### TTS — Синтез речи

**Расположение:** `src/Inktide.API.TTS/`

**Ответственность:** Принимает текстовые чанки, синтезирует аудио, генерирует viseme-таймлайн для синхронизации губ.

**Поток:**
```
synapse.llm.response
        ↓
LlmResponseStreamConsumer
        ↓
TtsSynthesisService → ISpeechProvider (KokoroTts / ElevenLabs / Cartesia / ...)
        ↓                              ↑ декораторы: Caching, Logging
        └── RhubarbService → VisemeCue[] (WAV → тайминги фонем)
        ↓
synapse.tts.ready (audio base64 + viseme timeline)
```

**Провайдеры:** Kokoro (default, local), ElevenLabs, Cartesia, Fish Audio, Azure Speech, Google Cloud TTS

**Декораторы:** `CachingSpeechProviderDecorator` (кэш по hash текста+голоса), `LoggingSpeechProviderDecorator`

**REST API:**
- `POST /api/tts/synthesize` — тело: `{ text, voice_id, model_id?, speed?, provider_id?, stream? }`
- API-ключ: header `X-TTS-Api-Key`

---

### Memory — Семантическая память (RAG)

**Расположение:** `src/Inktide.API.Memory/`

**Ответственность:** Извлечение фактов из диалогов, векторное хранение, retrieval при генерации.

**Ingestion (запись):**
```
LlmStreamWorker (после LLM ответа)
        ↓ MemoryIngestionJob (enqueue в in-memory channel)
MemoryIngestionWorker (batch: 5 сообщений ИЛИ 3 сек)
        ├── ScribeFactExtractionClient → POST http://localhost:8001/extract-facts
        │   └─ Scribe (Python FastAPI) → Qwen LLM → список фактов с importance score
        ├── фильтр по MinImportanceThreshold (0.3)
        ├── IEmbeddingGenerator → POST Ollama /v1/embeddings (model: nomic-embed-text)
        └── Qdrant GRPC upsert + PostgreSQL metadata
```

**Retrieval (чтение — RagScatterShard):**
```
MemoryQueryService
  ├── embed(userMessage) → Ollama
  └── Qdrant search (collection: chat_memories, top-K)
      → MemoryRecord[] → вставляется в system prompt
```

**Qdrant:** коллекция `chat_memories`, векторы float[768], метаданные: AiCardId, FactText, Category, Importance, ExpiresAt

---

### Realtime — Доставка аудио в браузер

**Расположение:** `src/Inktide.API.Realtime/`

**Ответственность:** SignalR hub → push аудио + viseme timeline в браузер клиенту.

```
synapse.tts.ready
        ↓
BrowserAudioPublisher
        ↓ SignalR
AudioHub (/audio)
  JoinChannel(channelId)  → Clients.Group("ch:{channelId}")
  → audioReceived { correlationId, audioBase64, contentType, visemeTimeline }
```

---

### Profile — Аккаунт пользователя

**Расположение:** `src/Inktide.API.Profile/`

- `GET /api/profile/me` — информация о пользователе
- Загрузка аватара/файлов → MinIO (S3)
- `deleteAccount()` — GDPR: каскадное удаление (AiCards, credentials, memories, Keycloak)

---

## Frontend (React 18 / TypeScript)

**Расположение:** `apps/web/src/`

### Структура

```
src/
├── App.tsx               # Маршрутизация
├── main.tsx              # Bootstrap: Keycloak init, DI composition root
├── api/                  # HTTP-клиент (apiFetch + jsonOrThrow)
│   ├── client.ts         # base fetch, token injection, 401-refresh
│   ├── soul.ts           # Cards, credentials (BYOK), catalog, scenes, models
│   ├── me.ts             # User account
│   ├── chat.ts           # LLM providers info
│   └── tts.ts            # TTS synthesis
├── context/
│   ├── AuthContext.tsx    # Keycloak state, userId, role, nickname
│   └── CharactersContext.tsx # Выбранный персонаж, грязное состояние, save
├── domain/character/     # Типы: AiCharacter, CharacterLlm, CharacterTts, ...
├── pages/
│   ├── DashboardPage/    # Сцена + аватар в полный экран
│   └── profile/settings/ # Brain, Voice, Providers, Identity, Memory, ...
├── components/ProfilePage/tabs/ # BrainTab, VoiceTab, ...
├── hooks/                # useCharacters, useLipSync, useTtsSynth, ...
├── services/             # Реализации: auth, lipsync, audio, upload
├── constants/
│   ├── settingsRoutes.ts # Маппинг tab→route
│   └── providerDefs.ts   # PROVIDER_DEFS (Ollama, Anthropic, DeepSeek)
└── i18n/                 # i18next: en/ru, lazy namespaces
```

### Auth-поток

```
main.tsx
  └── keycloak.init({ onLoad: 'check-sso', pkce: true })
        ↓
  AuthContext → парсит JWT: sub → userId, preferred_username, realm_access.roles
        ↓
  ProtectedRoute → если !authenticated → редирект на Keycloak login (realm: inktide)
```

Токены: localStorage (`inktide_kc_token`, `inktide_kc_refresh`). Refresh: автоматически в `apiFetch` при 401.

### Доменная модель персонажа

```typescript
// domain/character/types.ts
interface AiCharacter {
  id: string
  identity: CharacterIdentity   // name, slug, systemPrompt, personality, visibility
  llm: CharacterLlm             // providerId, modelId, baseUrl, temperature, maxTokens, topP, ...
  tts: CharacterTts             // providerId, voiceId, speed, stability, pitch
  appearance: CharacterAppearance // avatarUrl, modelType, bannerColor
  behavior: CharacterBehavior   // responseDelayMs, language, autoModerate
  memory: CharacterMemory       // enabled, retentionDays, importanceThreshold
  autoPilot: CharacterAutoPilot // enabled, mood, idleTimeout
  channels: ChannelResponse[]   // Discord/Twitch привязки
}
```

### Ключевые страницы настроек

| Страница | Путь | Описание |
|----------|------|---------|
| `SettingsHubPage` | `/profile/settings` | Сетка ссылок на все вкладки |
| `BrainPage` / `BrainTab` | `/profile/settings/brain` | Выбор LLM-провайдера + модели + параметры (temperature, topP, ...) |
| `VoicePage` | `/profile/settings/voice` | TTS-провайдер, голос, speed/pitch/stability |
| `ProvidersPage` | `/profile/settings/providers` | BYOK-ключи: список провайдеров с зелёными/серыми точками |
| `ProviderDetailPage` | `/profile/settings/providers/:id` | Форма ввода API-ключа для провайдера |
| `IntegrationsPage` | `/profile/settings/integrations` | Discord/Twitch каналы |
| `IdentityPage` | `/profile/settings/identity` | Имя, systemPrompt, personality, slug |
| `ModelPage` | `/profile/settings/model` | 3D/2D аватар (VRM, GLB, Live2D) |
| `ScenePage` | `/profile/settings/scene` | Фоновые изображения |
| `MemoryPage` | `/profile/settings/memory` | Настройки RAG-памяти |

---

## Python FastAPI Workers (`fast-api/`)

### Scribe (порт 8001)
**Назначение:** Извлечение структурированных фактов из диалогов через Qwen LLM (Ollama).

| Endpoint | Метод | Описание |
|----------|-------|---------|
| `/api/v1/extract-facts` | POST | `{userMessage, botResponse}` → `{facts: [...]}` |
| `/api/v1/embed` | POST | Одиночный embedding |
| `/api/v1/embed/batch` | POST | Batch embeddings |
| `/api/v1/classify` | POST | Семантическая классификация текста |
| `/health` | GET | Health check |

### Semantic Model
Отдельный воркер — embeddings + classify для других нужд (без Qwen, только embedding-модель).

---

## Rust Crates (`crates/`)

| Crate | Назначение |
|-------|-----------|
| `inktide-lipsync` | WAV → `VisemeTimeline`: Rhubarb CLI (высокое качество) или AmplitudeAnalyzer (fallback) |
| `inktide-audio` | Виртуальный аудиовыход, буферизация |
| `inktide-animation` | Анимации персонажа |
| `inktide-rendering` | 3D/2D рендеринг аватара (использует lipsync) |
| `inktide-server` | gRPC-сервер (точка входа, stub) |

---

## Keycloak

**Realm:** `inktide` (для пользователей приложения), `inktide-backend-admin` (для admin API)
**Клиент:** `inktide-web` (public, PKCE)

### Тема (`keycloak/theme/`)
React + Vite + Keycloakify. Страницы: login, register, account, email-templates.
Сборка: `npm run build-keycloak-theme` → JAR → `/opt/keycloak/providers/`

### Twitch Provider (`keycloak/twitch-provider/`)
Java/Maven. Keycloak OIDC Identity Provider для Twitch OAuth (патч бага десериализации scope). 
Сборка: `mvn clean package -DskipTests` → JAR → `/opt/keycloak/providers/`

---

## Полный путь сообщения (end-to-end)

```
1. Discord: пользователь пишет в чат
        ↓
2. DiscordConnector (Discord.Net Gateway)
   → DiscordMessageMapper → ChatMessage
        ↓
3. ChatMessageChannel (in-memory, неблокирующий буфер)
        ↓
4. RedisStreamPublisherWorker
   → XADD synapse.ingest {payload: JSON(ChatMessage)}
        ↓
5. ChatMessageStreamConsumer (XREADGROUP)
   → SynapseIngestOrchestrator
        ↓
6. ChannelContextResolutionService
   → gRPC GetAiCardByChannelId(channelId) → порт 8084
   → AiCard + userId + конфиг (LLM, TTS, системный промпт)
        ↓
7. [ПАРАЛЛЕЛЬНО — scatter]
   ├── SessionScatterShard → история диалога из Redis (20 turns)
   └── RagScatterShard:
         embed(userMessage) → Ollama :11434
         search(Qdrant) → top-K факты о пользователе
        ↓
8. SynapseAggregationService → SynapseAggregatedEnvelope
   → XADD synapse.llm.ready {payload: JSON(envelope)}
        ↓
9. LlmStreamWorker (XREADGROUP synapse.llm.ready)
   ├── GetDecryptedAsync(userId, providerId) → UserProviderCredential
   ├── ChatServiceFactoryRegistry.CreateService(provider, model, apiKey, baseUrl)
   │   └── OpenAiCompatChatServiceFactory → new OpenAIChatCompletionService(...)
   ├── SK GetStreamingChatMessageContentsAsync → токены
   ├── SentenceAccumulator → предложения
   └── XADD synapse.llm.response {correlationId, text, isLast, voiceId, ...}
        ↓
10. LlmResponseStreamConsumer (XREADGROUP synapse.llm.response)
    ├── TtsSynthesisService → ISpeechProvider (Kokoro/ElevenLabs/...)
    ├── RhubarbService → VisemeCue[] (тайминги фонем для губ)
    └── XADD synapse.tts.ready {audioBase64, visemeTimeline, ...}
        ↓
11. BrowserAudioPublisher (XREADGROUP synapse.tts.ready)
    → SignalR AudioHub.Clients.Group("ch:{channelId}")
    → audioReceived { audioBase64, visemeTimeline }
        ↓
12. Browser (React):
    ├── WebAudioPlayer → воспроизводит аудио
    ├── useLipSync → VRM blend shapes по viseme timeline
    └── 3D аватар двигает губами в реальном времени

[параллельно с 9→10]
13. MemoryIngestionWorker (батч 5 сообщений / 3 сек):
    ├── Scribe :8001/extract-facts → факты из диалога
    ├── Ollama embed → векторы
    └── Qdrant upsert → для будущего RAG
```

---

## Порты и сервисы

| Сервис | Порт | Протокол |
|--------|------|---------|
| .NET REST API | 5001 | HTTP |
| Soul gRPC | 8084 | HTTP/2 gRPC |
| General gRPC | 8081 | HTTP/2 gRPC |
| Keycloak | 8080 | HTTP |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| Qdrant REST | 6333 | HTTP |
| Qdrant gRPC | 6334 | HTTP/2 gRPC |
| MinIO API | 9000 | HTTP (S3) |
| MinIO Console | 9001 | HTTP |
| Ollama | 11434 | HTTP (host) |
| Kokoro TTS | 8880 | HTTP |
| Scribe | 8001 | HTTP |
| React Dev | 3000 | HTTP |

---

## CORS

Разрешённые origins: `localhost:3000`, `localhost:5173`, `localhost:1420`, `tauri://localhost`

## Секреты (CHANGE_ME__)

- `KEYCLOAK_ADMIN_CLIENT_ID` / `CLIENT_SECRET`
- `POSTGRES_DATABASE` / `USERNAME` / `PASSWORD`
- `DISCORD_BOT_TOKEN`
- `MINIO_ACCESS_KEY` / `SECRET_KEY`
- `OPENAI_API_KEY`, `OPENROUTER_API_KEY` (только если не BYOK)

