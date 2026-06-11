# Pipeline Latency Benchmark

Measures end-to-end latency: chat message injected into `synapse.ingest` → first/last audio byte received via SignalR.

SLO target: < 4000ms total.

## Requirements

Full stack must be running: Redis, .NET API, vLLM/Ollama, Kokoro TTS.

```bash
cd tools/pipeline-bench
npm install
```

`JWT_TOKEN` must belong to the owner of `CHANNEL_ID`. Get it from browser DevTools → Application → LocalStorage → `inktide_kc_token`.

## Quick check (single run)

```bash
CHANNEL_ID=<uuid> JWT_TOKEN=<token> node bench.js
```

Optional env vars:

| Var | Default |
|-----|---------|
| `MESSAGE` | `Hello, benchmark test.` |
| `API_URL` | `http://localhost:5001` |
| `REDIS_URL` | `redis://localhost:6379` |

## JSON mode (for scripting)

```bash
CHANNEL_ID=<uuid> JWT_TOKEN=<token> node bench.js --json
# → {"ts":"...","firstByteMs":820,"totalMs":1950,"chunks":3,"sloViolation":false,...}
```

Exits 1 on error or timeout with `{"error":"TIMEOUT|SIGNALR_ERROR|REDIS_ERROR","message":"..."}`.

## Production benchmark (N iterations)

```bash
CHANNEL_ID=<uuid> JWT_TOKEN=<token> ITERATIONS=20 bash run.sh
```

Results are appended to `results/YYYYMMDD_HHMMSS.jsonl` (one JSON object per line, ignored by git).

## View report

```bash
node report.js results/<file>.jsonl        # formatted output
node report.js results/<file>.jsonl --ci   # plain key=value for CI logs
```

Exits 1 if SLO violation rate > 5%.

## CI / Automated SLO Tracking

The workflow `.github/workflows/slo-benchmark.yml` runs daily at 06:00 UTC.

Required GitHub secrets:

| Secret | Value |
|--------|-------|
| `BENCH_CHANNEL_ID` | GUID of a Soul channel (must exist in prod) |
| `BENCH_JWT_TOKEN` | JWT of the channel owner (long-lived service token) |
| `BENCH_API_URL` | `https://api.inktide.com` (or staging URL) |
| `BENCH_REDIS_URL` | `redis://:password@host:6379` |

The job fails if SLO violation rate > 5% across the run. Results are uploaded as GitHub Actions artifacts (retained 30 days).

Manual trigger: Actions → SLO Benchmark → Run workflow.
