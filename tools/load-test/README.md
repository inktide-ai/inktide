# Inktide Load-Test Suite

Production-grade нагрузочное тестирование Inktide API: **k6** (сценарная нагрузка, SLO-гейты, SignalR E2E) + **bombardier** (raw HTTP / load-shedding baseline). Результаты — в JSON с CI-гейтом и regression-сравнением, live-картинка — в Grafana (compose-профиль `bench`).

## Быстрый старт

```bash
# 0. Зависимости: k6 >= v2, node >= 20, bombardier (опционально)
brew install k6 bombardier

# 1. Стек
docker compose --profile core up -d

# 2. Конфиг
cp .env.example .env            # заполнить BENCH_USER_PASSWORD, KC_ADMIN_PASSWORD

# 3. Пул тестовых юзеров (идемпотентно)
node scripts/seed-users.mjs --count 50
node scripts/fetch-tokens.mjs

# 4. Прогон
PROFILE=smoke bash scripts/run.sh
```

Для `chatE2E` (полный пайплайн чата) дополнительно: `--profile workers` + Ollama на хосте, и `node scripts/seed-card.mjs` → `CHAT_CARD_ID` в `.env`.

## Профили

| Профиль | Что измеряет | Длительность | Требует |
|---|---|---|---|
| `smoke` | функциональный гейт: ошибки, 429, SignalR handshake | ~1 мин | core |
| `baseline` | steady-state SLO под production-like миксом | 10 мин | core + workers |
| `stress` | точку насыщения authenticated CRUD (10→200 rps) | ~16 мин | core |
| `spike` | burst-устойчивость (8x скачок и восстановление) | ~7 мин | core |
| `soak` | 2ч endurance: утечки, дрейф латентности, WS keepalive, refresh токенов | 2 ч | core + workers |
| `limits` | 429-enforcement лимитера (нарушает бюджеты!) | ~5 мин | core, **изолированно** |

`stress` / `spike` / `soak` — никогда против production.

## Rate limits: почему нужен пул юзеров

Лимиты API ([TtsRateLimiterStartup.cs](../../src/Inktide.API/Deployment/TtsRateLimiterStartup.cs)) — часть системы, suite их **не отключает**:

| Бюджет | Значение | Следствие для нагрузки |
|---|---|---|
| Аноним | 60 req/min **на IP** | все анонимные сценарии с одного хоста делят один бюджет |
| Авторизованный | 300 req/min **на юзера** (`sub`) | throughput = пул юзеров × 5 req/s; 30 rps ⇒ пул ≥ 8 |
| TTS synthesize | 20 req/60s на юзера | 5 rps TTS ⇒ пул ≥ 20 |

`scripts/preflight.mjs` (вызывается из `run.sh`) статически проверяет эту математику и **отказывается стартовать**, если профиль упрётся в лимитер: аноним > 90% бюджета, авторизованные > 4 req/s/юзера (80%), TTS > 0.25 req/s/юзера (75%). Не браузируйте приложение с load-gen хоста во время прогона — съедите анонимный бюджет.

## Архитектура

```
k6/
├── main.js          единая точка входа; scenarios собираются из профиля
├── lib/             ядро: config (merge default+profile+env), metrics (реестр
│                    всех Trend/Rate/Counter), checks, summary (handleSummary)
├── clients/         протокольные адаптеры: http (base), auth (Keycloak,
│                    refresh-aware), signalr (JSON hub protocol поверх WS),
│                    publicApi / profileApi / ttsApi, chatInjector (порт:
│                    http | redis)
├── scenarios/       по одному exec на сценарий — чистые описания поведения
└── data/users.js    SharedArray токенов, VU→user = (idInTest-1) % pool
```

**Правило слоёв:** `scenarios/` → `clients/` + `lib/`; `clients/` → только `lib/` и k6-модули; `lib/` не импортирует ничего проектного. Импорты k6-модулей — только в `clients/` и `lib/`. Новый сценарий = файл в `scenarios/` + re-export в `main.js` + записи в профилях.

**Конфигурация (3 слоя, по возрастанию приоритета):** `config/default.json` (константы: эндпоинты, SLO, бюджеты) → `config/profiles/<P>.json` (executors, rates, **thresholds живут здесь**) → env-переменные (`.env` / `-e`, см. `.env.example`).

## Сценарии и метрики

| Сценарий | Модель | Кастомные метрики |
|---|---|---|
| `health` | open (arrival-rate) | `health_ready_success` |
| `publicRest` | open | `anon_429` (порог `rate==0` — любой 429 = ошибка бюджета) |
| `authCrud` | open; ramping в stress/spike | микс 40/20/20/15/5: GET prefs / GET me / PATCH prefs / projects / souls; `crud_429` |
| `ttsStream` | open, ≤0.25 req/s/юзера | `tts_ttfb_ms` (время до первого байта аудио), `tts_total_ms`, `tts_bytes`, `tts_429` |
| `chatE2E` | **closed** (constant-vus) — open навалил бы бесконечную очередь на GPU и мерил бы взрыв очереди, а не capacity | `chat_first_token_ms`, `chat_first_audio_ms`, `chat_total_ms` (SLO p95<4000), `chat_slo_violations` (<5%), `chat_timeouts`, `signalr_handshake_ok` |
| `rateLimits` | burst (limits) | `limiter_enforced` (`rate==1`) |

Пороги на API-латентность используют селектор `{scenario:…,kind:api}` — Keycloak-refresh трафик (`kind:auth`) в них не попадает.

**chatE2E** ходит по реальной пользовательской поверхности: `POST /api/v1/connectors/inktide/messages` → Redis `synapse.ingest` → LlmStreamWorker → SignalR `/hubs/audio` (`textChunk` / `audioReceived`). Одна итерация = сессия из N сообщений (WS-соединение не может пережить итерацию k6 — event loop должен дренироваться). `CHAT_INJECTOR=redis` воспроизводит семантику `tools/pipeline-bench` (XADD) для кросс-валидации. Без `CHAT_CARD_ID` сценарий деградирует до connect+JoinChannel handshake-проверки (так работает CI smoke).

SLO унаследованы от pipeline-bench: **p95 < 4000ms E2E, fail при violation rate > 5%**.

## Отчёты

```bash
node scripts/report.mjs results/<ts>_<profile>.json           # таблица
node scripts/report.mjs results/<ts>_<profile>.json --ci      # key=value, exit 1 при FAIL
node scripts/report.mjs compare baselines/baseline.json results/<новый>.json --tolerance 10
node scripts/report.mjs promote results/<хороший>.json        # → baselines/<profile>.json (коммитится)
```

Каждый k6-прогон пишет `results/<ts>_<profile>.json` (компактная схема, общая с bombardier) и `..._summary.json` (полный дамп k6).

## Grafana + Prometheus

```bash
docker compose --profile bench up -d
PROFILE=baseline PROM_RW_URL=http://localhost:9090/api/v1/write bash scripts/run.sh
open http://localhost:3001    # дашборд «Inktide · Load Test» (порт 3001 — 3000 занят Next.js)
```

Prometheus скрейпит `/metrics` API по двум таргетам — `dotnet:5001` (compose) и `host.docker.internal:5001` (`dotnet run`); один из них всегда down, это ожидаемо. k6 пишет метрики через remote write. Дашборд: клиентский ряд (RPS/p95/429/E2E с линией SLO 4000ms) + серверный ряд (`http_server_request_duration` по route/status). Панель `synapse_e2e_latency_ms` оживёт, когда API начнёт записывать этот инструмент (сейчас он определён, но не инструментирован — см. `ObservabilityStartup.cs`).

## Bombardier

```bash
bash scripts/bombardier.sh
```

Честный фрейминг: выше 60 anon/min и 300 auth/min API отвечает 429 **by design**, поэтому bombardier меряет **connection-handling и скорость load-shedding** (Kestrel + rate-limiter fast-path), а не бизнес-throughput. Для SLO-цифр — k6-профили. Третий таргет (`--rate 2`) даёт чистую латентность внутри бюджета.

## CI (`.github/workflows/load-test.yml`)

- **PR → smoke**: собирает образ (gha cache), поднимает core-стек (без stripe-cli), `bootstrap-realm.mjs` создаёт realm `chimera` с нуля, сидирует 5 юзеров, гоняет smoke с порогами. ttsStream/полный chatE2E пропущены (нужны kokoro/Ollama).
- **Weekly + dispatch → full**: против staging через секреты `BENCH_API_URL`, `BENCH_KC_URL`, `BENCH_USER_PASSWORD`, `BENCH_USER_POOL_SIZE`, `BENCH_CHAT_CARD_ID` (пул сидируется на staging один раз). Гейт `--ci` + regression-compare с `baselines/` (±10%).

## Траблшутинг

| Симптом | Причина |
|---|---|
| `preflight ✗ … tokens.json missing` | `seed-users.mjs` + `fetch-tokens.mjs` не запускались |
| 401 в authCrud | токены протухли (>5 мин после fetch) и `BENCH_USER_PASSWORD` пуст — refresh не смог сфоллбэчиться |
| `crud_429 > 0` | пул мал для рейта — увеличьте `USER_POOL_SIZE` (и пересидируйте) |
| `anon_429 > 0` | параллельный трафик с хоста съел IP-бюджет |
| chatE2E: сплошные `chat_timeouts` | workers-профиль/Ollama не подняты, или `CHAT_CARD_ID` невалиден |
| k6: `k6/x/redis`-ошибка | k6 < v2 — обновите (`brew upgrade k6`) |
