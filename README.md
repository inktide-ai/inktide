# Inktide

AI-powered live-streaming companion. Inktide listens to Discord / Twitch / Telegram chat and an
in-app chat, then responds in voice inside the stream in ~1.3s. The whole design is built around one
constraint — **latency**: TTS starts synthesizing the first sentence while the LLM is still
generating the rest, shaving ~800ms off perceived response time.

**Latency budget — message received → voice in stream: < 4s**

| Stage | Budget |
|-------|--------|
| Ingest, rate limit, sampling | 0–50ms |
| Context assembly (Redis + Qdrant + DB, in parallel) | 50–200ms |
| vLLM generation (GPU bottleneck, ~75% of budget) | 200–3000ms |
| TTS synthesis of first sentence (parallel with LLM tail) | 500–1300ms |

---

## Repository layout

| Path | Stack | Description |
|------|-------|-------------|
| `src/` | .NET 10 | API host + bounded-context modules (`Inktide.API.sln`) |
| `apps/web/` | Next.js 16 / React / TS | Web frontend (Feature-Sliced Design) |
| `apps/desktop/` | Tauri | Desktop app |
| `crates/` | Rust | Media rendering, audio, animation, lipsync |
| `keycloak/` | Keycloakify / Java | Custom login/email theme + Twitch identity provider |
| `fast-api/` | Python / FastAPI | AI/embedding workers (ai-worker, scribe) |
| `docs/` | — | DB schema (`schema.sql`, `schema.dbml`) |

---

## Prerequisites

- **.NET 10 SDK**
- **Node.js** (LTS) + npm
- **Docker** + Docker Compose
- **Rust** toolchain (for `crates/`, optional unless touching media)
- **Java 17 + Maven** (only for the Keycloak Twitch provider)
- **Python 3.11+** (only for `fast-api/` workers)

A local GPU running vLLM/Ollama is required for actual LLM responses; the rest of the stack runs
without it.

---

## Quick start

### 1. Configure environment

```bash
cp .env.example .env
# Fill in every CHANGE_ME__* value. Secrets live ONLY in .env — this project does
# NOT use dotnet user-secrets. Section__Property maps to ASP.NET config (Section:Property).
```

The API validates required secrets at startup and refuses to boot while any `CHANGE_ME` value
remains (see `src/Inktide.API/Program.cs`).

### 2. Start infrastructure (Postgres, Keycloak, Redis, MinIO)

```bash
docker compose --profile core up -d
```

> Services are grouped by Compose profile — a bare `docker compose up` starts nothing.
> - `--profile core` → postgres, postgres-keycloak, keycloak (`:8080`), redis (`:6379`), minio (`:9000`, console `:9001`)
> - `--profile dev` → MailHog mail catcher (`http://localhost:8025`)
> - `--profile workers` → Python AI workers

### 3. Run the backend

```bash
dotnet build Inktide.API.sln
dotnet run --project src/Inktide.API        # Kestrel on http://127.0.0.1:5001
```

### 4. Run the frontend

```bash
cd apps/web
npm install
npm run dev                                  # http://localhost:3000  (proxies /api → :5001)
```

---

## Other components

```bash
# Python AI workers
cd fast-api/ai-worker        && uvicorn main:app --port 8000   # embeddings + classify
cd fast-api/ai-worker/scribe && uvicorn main:app --port 8001   # fact extraction

# Rust crates
cd crates && cargo build && cargo test

# Keycloak theme  → copy built jar into keycloak-extensions/ and restart Keycloak
cd keycloak/theme && npm install && npm run build-keycloak-theme

# Keycloak Twitch provider
cd keycloak/twitch-provider && mvn clean package -DskipTests
```

---

## Testing

```bash
dotnet test Inktide.API.sln                  # backend
cd apps/web && npm run test                   # frontend (vitest)
cd crates  && cargo test                      # rust
```

---

## Beta status

Inktide is approaching beta. Honest snapshot of maturity:

**Working**
- Modular .NET backend across 18 bounded contexts (Soul, Synapse, Memory, Connector, TTS,
  Profile, Billing, Organization, Marketplace, …)
- Chat ingestion → Synapse orchestration → LLM → TTS → realtime playback pipeline (Redis Streams)
- Keycloak auth, BFF token proxy, billing webhooks (Stripe / YooKassa)
- Web frontend with the workspace, soul/character editor, graph builder, and developer portal

**In progress / not yet complete**
- Frontend developer portal and route restructuring (large in-flight change)
- SLO observability: the three Synapse SLO meters are **defined but not yet instrumented**
  in the pipeline — no live data is recorded yet
- Memory / Realtime / Graph contexts are functional but less mature than the core path

---

## Key local endpoints

| Service | Address |
|---------|---------|
| Backend API (Kestrel) | `http://127.0.0.1:5001` |
| Web frontend | `http://localhost:3000` |
| Keycloak | `http://localhost:8080/realms/inktide-app` |
| Postgres | `localhost:5432` |
| Redis | `localhost:6379` |
| MinIO (S3) | `http://127.0.0.1:9000` (console `:9001`) |
| Soul gRPC | `:8084` |
