#!/usr/bin/env bash
set -euo pipefail

ITERATIONS=${ITERATIONS:-20}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
mkdir -p "$RESULTS_DIR"

OUTFILE="$RESULTS_DIR/$(date +%Y%m%d_%H%M%S).jsonl"

echo "Running $ITERATIONS iterations → $OUTFILE"
echo "CHANNEL_ID=$CHANNEL_ID"
echo ""

PASS=0
FAIL=0

for i in $(seq 1 "$ITERATIONS"); do
  printf "  [%2d/%d] " "$i" "$ITERATIONS"

  RESULT=$(JSON_OUTPUT=1 node "$SCRIPT_DIR/bench.js" 2>/dev/null || true)
  echo "$RESULT" >> "$OUTFILE"

  SUMMARY=$(echo "$RESULT" | node -e "
    try {
      const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      if (d.error) { process.stdout.write('ERROR: ' + d.error); process.exit(0); }
      const slo = d.sloViolation ? ' ⚠️  SLO' : ' ✓';
      process.stdout.write(d.totalMs + 'ms' + slo);
    } catch(e) { process.stdout.write('ERROR: parse failed'); }
  " 2>/dev/null || echo "ERROR: node failed")

  echo "$SUMMARY"

  if echo "$SUMMARY" | grep -q "ERROR\|SLO"; then
    FAIL=$((FAIL + 1))
  else
    PASS=$((PASS + 1))
  fi

  if [ "$i" -lt "$ITERATIONS" ]; then
    sleep 2
  fi
done

echo ""
echo "  Pass: $PASS / $ITERATIONS"
echo ""
echo "Run report:"
echo "  node $SCRIPT_DIR/report.js $OUTFILE"
