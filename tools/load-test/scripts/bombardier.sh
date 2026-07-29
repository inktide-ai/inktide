#!/usr/bin/env bash
# Raw HTTP throughput baseline via bombardier.
#
# What this measures (and what it doesn't): beyond 60 anon req/min or
# 300 authed req/min the API answers 429 by design, so sustained bombardier
# numbers characterize the Kestrel + rate-limiter SHED PATH — how fast the
# API rejects excess traffic (a real resilience property) — NOT business
# throughput. For SLO latency numbers use the k6 profiles.
#
# Usage: bash scripts/bombardier.sh    (reads tools/load-test/.env if present)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

BASE_URL="${BASE_URL:-http://localhost:5001}"
DURATION="${BOMBARDIER_DURATION:-30s}"

command -v bombardier >/dev/null 2>&1 || {
  echo "error: bombardier not found — brew install bombardier" >&2
  exit 1
}

TOKEN=""
if [ -f data/tokens.json ]; then
  TOKEN="$(node -e "console.log(JSON.parse(require('fs').readFileSync('data/tokens.json','utf8'))[0].access_token)")"
fi

RUN_ID="$(date +%Y%m%d_%H%M%S)"
OUT="results/${RUN_ID}_bombardier.json"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

run_target() {
  local name="$1" url="$2" conns="$3" rate="$4" auth="$5"
  local args=(-c "$conns" -d "$DURATION" -o json --no-print)
  [ -n "$rate" ] && args+=(--rate "$rate")
  [ -n "$auth" ] && args+=(-H "Authorization: Bearer $TOKEN")
  echo "▶ $name  ($url, -c $conns${rate:+, --rate $rate}, $DURATION)"
  bombardier "${args[@]}" "$url" > "$TMP_DIR/$name.json"
}

# 1. Anonymous shed path: unauthenticated endpoint far beyond the IP budget.
run_target "health_shed" "$BASE_URL/health/live" 10 "" ""

# 2. Authenticated shed path (skipped without a token pool).
if [ -n "$TOKEN" ]; then
  run_target "authed_shed" "$BASE_URL/api/v1/me/preferences" 25 "" "auth"
else
  echo "⚠ data/tokens.json missing — skipping authenticated target"
fi

# 3. Sub-limit clean-latency datapoint: 2 req/s stays inside every budget.
run_target "clean_latency" "$BASE_URL/api/v1/chat/providers" 2 2 ""

# Merge bombardier outputs into the shared compact schema.
RUN_ID="$RUN_ID" BASE_URL="$BASE_URL" DURATION="$DURATION" TMP_DIR="$TMP_DIR" OUT="$OUT" node <<'EOF'
const { readFileSync, readdirSync, writeFileSync } = require('node:fs');
const { RUN_ID, BASE_URL, DURATION, TMP_DIR, OUT } = process.env;

const usToMs = (x) => (typeof x === 'number' ? x / 1000 : x);
const targets = [];

for (const f of readdirSync(TMP_DIR).filter((f) => f.endsWith('.json'))) {
  const { spec, result } = JSON.parse(readFileSync(`${TMP_DIR}/${f}`, 'utf8'));
  const lat = result.latencies || {};
  const p = lat.percentiles || {};
  targets.push({
    name: f.replace(/\.json$/, ''),
    url: spec.url,
    connections: spec.numberOfConnections,
    duration: DURATION,
    rate: spec.rate || null,
    rps: { mean: result.rps?.mean ?? 0, max: result.rps?.max ?? 0 },
    latency_ms: {
      mean: usToMs(lat.mean),
      p50: usToMs(p['50']),
      p90: usToMs(p['90']),
      p95: usToMs(p['95']),
      p99: usToMs(p['99']),
      max: usToMs(lat.max),
    },
    status: {
      '2xx': result.req2xx ?? 0,
      '4xx': result.req4xx ?? 0,
      '5xx': result.req5xx ?? 0,
      other: (result.req1xx ?? 0) + (result.req3xx ?? 0) + (result.others ?? 0),
    },
  });
}

writeFileSync(
  OUT,
  JSON.stringify(
    {
      tool: 'bombardier',
      profile: 'bombardier',
      ts: new Date().toISOString(),
      run_id: RUN_ID,
      base_url: BASE_URL,
      passed: true,
      metrics: {},
      thresholds: {},
      targets,
    },
    null,
    2,
  ),
);
console.log(`\n✓ ${OUT}`);
EOF

node scripts/report.mjs "$OUT"
