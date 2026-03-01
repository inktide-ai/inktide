# Chimera

Polyglot monorepo.

## Structure

| Path | Description |
|------|-------------|
| `src/Chimera.ApiGateway` | .NET 10 API Gateway (REST + gRPC) |
| `src/Chimera.AI.Orchestrator` | .NET 10 AI Orchestrator (RAG, Qdrant, Ollama) |
| `apps/web` | React / Vite frontend |
| `infrastructure/` | Observability config (Prometheus, Loki, Tempo, Grafana) |
| `deploy/` | Docker Compose files |
