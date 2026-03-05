# План рефакторинга Chimera → архитектура aspnetrun

Цель: выделить сервисы в отдельные приложения и оставить API Gateway тонким (только YARP + маршрутизация).

---

## Целевая архитектура

```
                    [Web / клиенты]
                            │
                            ▼
              ┌─────────────────────────────────┐
              │   Chimera.Gateway (YARP only)   │  ← тонкий, без своей БД
              │   - маршрутизация               │
              │   - CORS, rate limiting         │
              │   - health, metrics             │
              └─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Chimera.Identity│ │ Chimera.Streaming│ │ Chimera.AI.     │
│ .API            │ │ .Host            │ │ Orchestrator    │
│                 │ │                 │ │ (уже есть)      │
│ /api/auth/*     │ │ Twitch, Discord │ │ /api/ai/*       │
│ /api/me         │ │ → RabbitMQ      │ │                 │
│ gRPC Auth       │ │                 │ │                 │
│ PostgreSQL      │ │ RabbitMQ client │ │ Qdrant, Ollama  │
│ Redis           │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Текущее vs целевое

| Компонент | Сейчас | После рефакторинга |
|-----------|--------|-------------------|
| Auth, Me | В Chimera.ApiGateway | Chimera.Identity.API |
| gRPC Auth | В Chimera.ApiGateway | Chimera.Identity.API |
| Twitch/Discord | В Chimera.ApiGateway (hosted services) | Chimera.Streaming.Host |
| /api/ai/* | YARP → AI.Orchestrator | Без изменений |
| Gateway | Всё выше + YARP + DryIoc + плагины | Только YARP, CORS, rate limit, health |

---

## Шаг 1: Создать Chimera.Identity.API

### Структура проекта (по аналогии с Ordering в aspnetrun)

```
services/
  Chimera.Identity/
    Chimera.Identity.API/           # ASP.NET Core host, controllers, gRPC
    Chimera.Identity.Application/   # IAuthService, IPasswordResetService, валидаторы
    Chimera.Identity.Domain/        # User entity, порты репозиториев
    Chimera.Identity.Infrastructure/# EF Core, Redis, репозитории
```

### Что перенести

| Из | В | Описание |
|----|---|----------|
| Chimera.ApiGateway.Domain (User, IUserRepository) | Chimera.Identity.Domain | Сущности и порты |
| Chimera.ApiGateway.Application (Auth, DTOs) | Chimera.Identity.Application | AuthService, PasswordReset |
| Chimera.ApiGateway.Infrastructure (EF, Redis, UserRepository) | Chimera.Identity.Infrastructure | БД, кэш |
| Chimera.ApiGateway.REST.API (AuthController, MeController) | Chimera.Identity.API | Контроллеры |
| Chimera.ApiGateway.Grpc.Auth, Grpc.Contracts (Auth.proto) | Chimera.Identity.API | gRPC AuthService |
| Chimera.ApiGateway.REST.API.Models | Chimera.Identity.API (или общий Models) | DTO для REST |

### Конфигурация Identity.API

- PostgreSQL — пользователи (порт 5432)
- Redis — refresh tokens
- Секреты: Auth:Secret, Bcrypt, SMTP
- Endpoints: REST 8080, gRPC 8081

### Docker

```yaml
# docker-compose
identity.api:
  build: Services/Chimera.Identity/Chimera.Identity.API
  environment:
    - ConnectionStrings__Postgres=...
    - ConnectionStrings__Redis=...
  depends_on: [identitydb, redis]
```

---

## Шаг 2: Создать Chimera.Streaming.Host

### Структура

```
services/
  Chimera.Streaming/
    Chimera.Streaming.Host/         # Console/Host app, hosted services
    Chimera.Connector.Twitch        # уже есть в packages/
    Chimera.Connector.Discord       # уже есть в packages/
```

### Что перенести

| Из | В | Описание |
|----|---|----------|
| ChatConnectorHostedService | Chimera.Streaming.Host | Запуск Twitch/Discord |
| IChatConnector, RabbitMQ publisher | Chimera.Streaming.Host или отдельный проект | Логика отправки в очередь |
| Twitch/Discord modules (Startup, settings) | Chimera.Streaming.Host | Регистрация коннекторов |

### Конфигурация

- RabbitMQ — для публикации сообщений чата
- TwitchSettings, DiscordSettings
- Не нужны: PostgreSQL, Redis (если только для стриминга)

### Docker

```yaml
streaming.host:
  build: Services/Chimera.Streaming/Chimera.Streaming.Host
  environment:
    - RabbitMq__Host=rabbitmq
  depends_on: [rabbitmq]
```

---

## Шаг 3: Создать Chimera.Gateway (тонкий YARP)

### Что остаётся в Gateway

1. **YARP Reverse Proxy** — только маршрутизация
2. **CORS** — политики
3. **Rate limiting** — опционально, in-memory
4. **Health checks** — агрегированные или просто "alive"
5. **Logging, metrics** — Serilog, Prometheus

### Что убирается

- Controllers (Auth, Me) → перенесены в Identity
- gRPC — перенесён в Identity (или вызывается напрямую)
- DryIoc, плагинная система — не нужна, можно использовать стандартный MS DI
- PostgreSQL, Redis — не нужны
- Domain, Application, Infrastructure — перенесены в Identity
- Twitch, Discord — перенесены в Streaming

### Конфигурация YARP (appsettings.json)

```json
{
  "ReverseProxy": {
    "Routes": {
      "identity-auth": {
        "ClusterId": "identity-cluster",
        "Match": { "Path": "/api/auth/{**catch-all}" }
      },
      "identity-me": {
        "ClusterId": "identity-cluster",
        "Match": { "Path": "/api/me" }
      },
      "ai-orchestrator": {
        "ClusterId": "ai-orchestrator-cluster",
        "Match": { "Path": "/api/ai/{**catch-all}" }
      }
    },
    "Clusters": {
      "identity-cluster": {
        "Destinations": {
          "default": { "Address": "http://identity.api:8080" }
        }
      },
      "ai-orchestrator-cluster": {
        "Destinations": {
          "default": { "Address": "http://ai.orchestrator:9090" }
        }
      }
    }
  }
}
```

### Важно: Path transform

Сейчас Gateway сам обрабатывает `/api/auth/*` и `/api/me`. После рефакторинга Identity.API должен слушать те же пути. Поэтому **проксируем как есть** — без удаления префикса. Identity получает `/api/auth/login`, `/api/me` и т.д.

### Нужен ли JWT в Gateway?

**Вариант A (рекомендуемый):** Gateway не валидирует JWT. Просто пробрасывает `Authorization` заголовок. Identity и AI.Orchestrator сами валидируют токен.

**Вариант B:** Gateway валидирует JWT и добавляет `X-User-Id` в заголовки для downstream. Требует AuthSettings в Gateway — чуть менее "тонкий", но упрощает бэкенды.

Для максимальной "тонкости" — Вариант A.

---

## Шаг 4: Обновить Chimera.AI.Orchestrator

- Добавить JWT validation для защищённых эндпоинтов (если ещё нет)
- Использовать те же AuthSettings (Secret, Issuer, Audience) — через конфиг
- Запросы к `/api/ai/*` приходят с заголовком `Authorization` от Gateway

---

## Шаг 5: gRPC Auth — куда обращаться

В aspnetrun gRPC вызывается **напрямую** между сервисами (Basket → Discount), не через Gateway.

Для Chimera:
- **REST** (`/api/auth/*`, `/api/me`) — через Gateway → Identity
- **gRPC** (AuthService) — вызывается напрямую `identity.api:8081` теми, кому нужно (например, будущий native client или другой сервис)

Gateway не проксирует gRPC, если не нужна единая точка входа для gRPC.

---

## Шаг 6: Порядок миграции (рекомендуемый)

1. **Создать Chimera.Identity.API** — скопировать/вырезать Domain, Application, Infrastructure, REST, gRPC. Запустить отдельно, проверить.
2. **Создать Chimera.Gateway** — новый минимальный проект с YARP. Проксировать на Identity и AI. Отключить в старом Gateway все модули кроме YARP для теста.
3. **Создать Chimera.Streaming.Host** — вынести Twitch/Discord.
4. **Удалить** старый Chimera.ApiGateway (или оставить как reference).
5. **Docker Compose** — собрать все сервисы.

---

## Шаг 7: Общая структура после рефакторинга

```
chimera/
  services/
    Chimera.Gateway/              # тонкий YARP
    Chimera.Identity/             # Auth, Users
      Chimera.Identity.API/
      Chimera.Identity.Application/
      Chimera.Identity.Domain/
      Chimera.Identity.Infrastructure/
    Chimera.Streaming/            # Twitch, Discord
      Chimera.Streaming.Host/
    Chimera.AI.Orchestrator/      # уже есть
  packages/
    Chimera.Connector.Twitch/
    Chimera.Connector.Discord/
  deploy/
    docker-compose.yml
```

---

## Shared / BuildingBlocks (опционально)

Как в aspnetrun есть BuildingBlocks.Messaging — можно вынести:
- **Chimera.Contracts** — DTO, Proto, общие модели (если используются в нескольких сервисах)
- **Chimera.BuildingBlocks** — базовые настройки (AuthSettings для JWT validation), если несколько сервисов валидируют токены

---

## Проверочный список

- [ ] Identity.API запускается, Auth + Me работают
- [ ] Gateway проксирует на Identity, ответы корректны
- [ ] Gateway проксирует на AI.Orchestrator
- [ ] Streaming.Host подключается к Twitch/Discord, пишет в RabbitMQ
- [ ] JWT от Identity валидируется в AI.Orchestrator (если нужно)
- [ ] docker-compose поднимает все сервисы
- [ ] Фронтенд (apps/web) работает через Gateway

---

## Краткая сводка

| Действие | Проект |
|----------|--------|
| Создать | Chimera.Identity.API (+ Application, Domain, Infrastructure) |
| Создать | Chimera.Streaming.Host |
| Создать | Chimera.Gateway (минимальный YARP) |
| Обновить | Chimera.AI.Orchestrator (JWT validation) |
| Удалить/архивировать | Текущий Chimera.ApiGateway |
