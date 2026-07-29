#!/usr/bin/env bash
# Load-test orchestrator. Usage:
#   PROFILE=smoke bash scripts/run.sh
#   PROFILE=baseline PROM_RW_URL=http://localhost:9090/api/v1/write bash scripts/run.sh
# Reads tools/load-test/.env if present (gitignored local overrides).
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

PROFILE="${PROFILE:-smoke}"
K6_BIN="${K6_BIN:-k6}"
# v2+: k6/websockets is stable, redis lives at k6/x/redis (removed from
# k6/experimental in v2) - older binaries can't load the suite.
K6_MIN_MAJOR=2

command -v "$K6_BIN" >/dev/null 2>&1 || {
  echo "error: k6 not found — brew install k6 (or set K6_BIN)" >&2
  exit 1
}
K6_MAJOR="$("$K6_BIN" version | sed -nE 's/^k6 v([0-9]+)\..*/\1/p')"
if [ -z "$K6_MAJOR" ] || [ "$K6_MAJOR" -lt "$K6_MIN_MAJOR" ]; then
  echo "error: k6 >= v${K6_MIN_MAJOR}.0 required, got: $("$K6_BIN" version)" >&2
  exit 1
fi

# Rate-budget guard - aborts before k6 starts if this profile would trip the
# API's rate limiter (see scripts/preflight.mjs).
PROFILE="$PROFILE" USER_POOL_SIZE="${USER_POOL_SIZE:-}" node "$SCRIPT_DIR/preflight.mjs"

RUN_ID="$(date +%Y%m%d_%H%M%S)"
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo '')"

ARGS=(run -e "PROFILE=$PROFILE" -e "RUN_ID=$RUN_ID" -e "GIT_SHA=$GIT_SHA")
for VAR in BASE_URL WS_URL KC_URL KC_REALM KC_CLIENT_ID BENCH_USER_PASSWORD USER_POOL_SIZE \
           CHAT_CARD_ID CHAT_INJECTOR REDIS_URL DEMO_LLM TTS_PROVIDER_ID TTS_VOICE_ID TTS_VOICES_PROVIDER; do
  if [ -n "${!VAR:-}" ]; then
    ARGS+=(-e "$VAR=${!VAR}")
  fi
done

# k6 -> Prometheus remote write (compose bench profile). Off when PROM_RW_URL empty.
if [ -n "${PROM_RW_URL:-}" ]; then
  export K6_PROMETHEUS_RW_SERVER_URL="$PROM_RW_URL"
  export K6_PROMETHEUS_RW_TREND_STATS="p(95),p(99),avg,max"
  export K6_PROMETHEUS_RW_STALE_MARKERS="true"
  ARGS+=(-o experimental-prometheus-rw)
fi

echo "▶ profile=$PROFILE run=$RUN_ID base=${BASE_URL:-http://localhost:5001}"
"$K6_BIN" "${ARGS[@]}" k6/main.js

echo ""
echo "Report:  node scripts/report.mjs results/${RUN_ID}_${PROFILE}.json"
echo "Compare: node scripts/report.mjs compare baselines/${PROFILE}.json results/${RUN_ID}_${PROFILE}.json"
