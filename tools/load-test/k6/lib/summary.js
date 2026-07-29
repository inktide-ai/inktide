// handleSummary implementation. Produces, per run:
//   results/<runId>_<profile>_summary.json — full k6 summary (debugging)
//   results/<runId>_<profile>.json         — compact stable schema, shared
//                                            with bombardier & report.mjs
//   stdout                                 — human-readable table (no jslib
//                                            imports; the suite is hermetic)
//
// Compact schema:
//   { tool, profile, ts, run_id, git_sha,
//     metrics:   { <name>: { type, avg|rate|count, p50/p95/p99, … } },
//     thresholds:{ <metric>: { <expr>: ok } },
//     passed: bool }

function compactMetric(m) {
  const v = m.values || {};
  switch (m.type) {
    case 'trend':
      return {
        type: 'trend',
        avg: round(v.avg),
        min: round(v.min),
        p50: round(v.med),
        p90: round(v['p(90)']),
        p95: round(v['p(95)']),
        p99: round(v['p(99)']),
        max: round(v.max),
      };
    case 'rate':
      return { type: 'rate', rate: round(v.rate, 4), passes: v.passes, fails: v.fails };
    case 'counter':
      return { type: 'counter', count: round(v.count), rate: round(v.rate, 2) };
    case 'gauge':
      return { type: 'gauge', value: v.value, min: v.min, max: v.max };
    default:
      return { type: m.type, values: v };
  }
}

function round(x, digits = 2) {
  if (typeof x !== 'number' || !isFinite(x)) return x;
  const f = Math.pow(10, digits);
  return Math.round(x * f) / f;
}

function collectThresholds(data) {
  const out = {};
  let passed = true;
  for (const [name, m] of Object.entries(data.metrics)) {
    if (!m.thresholds) continue;
    out[name] = {};
    for (const [expr, st] of Object.entries(m.thresholds)) {
      out[name][expr] = { ok: st.ok };
      if (!st.ok) passed = false;
    }
  }
  return { thresholds: out, passed };
}

function fmtMs(x) {
  if (typeof x !== 'number' || !isFinite(x)) return '-';
  return x >= 1000 ? `${(x / 1000).toFixed(2)}s` : `${x.toFixed(1)}ms`;
}

function renderText(compact, config) {
  const line = '─'.repeat(72);
  const rows = [];
  rows.push(line);
  rows.push(` inktide load-test · profile=${config.profileName} · run=${config.runId}` + (compact.git_sha ? ` · ${compact.git_sha}` : ''));
  rows.push(line);

  const t = compact.thresholds;
  const total = Object.values(t).reduce((n, m) => n + Object.keys(m).length, 0);
  const failed = Object.values(t).reduce(
    (n, m) => n + Object.values(m).filter((s) => !s.ok).length, 0);
  rows.push(` THRESHOLDS  ${compact.passed ? 'PASS' : 'FAIL'} (${total - failed}/${total})`);
  for (const [metric, exprs] of Object.entries(t)) {
    for (const [expr, st] of Object.entries(exprs)) {
      rows.push(`   ${st.ok ? '✓' : '✗'} ${metric.padEnd(44)} ${expr}`);
    }
  }

  rows.push('');
  rows.push(' KEY METRICS');
  for (const [name, m] of Object.entries(compact.metrics)) {
    if (m.type === 'trend') {
      rows.push(`   ${name.padEnd(34)} p95 ${fmtMs(m.p95).padStart(9)}  p99 ${fmtMs(m.p99).padStart(9)}  avg ${fmtMs(m.avg).padStart(9)}`);
    } else if (m.type === 'rate') {
      rows.push(`   ${name.padEnd(34)} rate ${String((m.rate * 100).toFixed(2)).padStart(7)}%  (${m.passes}/${(m.passes || 0) + (m.fails || 0)})`);
    } else if (m.type === 'counter') {
      rows.push(`   ${name.padEnd(34)} count ${String(m.count).padStart(8)}  ${m.rate}/s`);
    }
  }
  rows.push(line);
  return rows.join('\n') + '\n';
}

// Metrics worth surfacing in the compact file / stdout. Untagged built-ins
// plus every custom instrument; tagged sub-metrics stay in the full summary.
const INTERESTING = /^(http_reqs|http_req_duration|http_req_failed|checks|iterations|vus_max|data_received|ws_.*|anon_429|crud_429|tts_.*|chat_.*|health_.*|token_refreshes|signalr_.*|limiter_.*)$/;

export function makeHandleSummary(config) {
  return function handleSummary(data) {
    const metrics = {};
    for (const [name, m] of Object.entries(data.metrics)) {
      if (INTERESTING.test(name)) metrics[name] = compactMetric(m);
    }
    const { thresholds, passed } = collectThresholds(data);

    const compact = {
      tool: 'k6',
      profile: config.profileName,
      ts: new Date().toISOString(),
      run_id: config.runId,
      git_sha: config.gitSha,
      base_url: config.baseUrl,
      user_pool_size: config.userPoolSize,
      passed,
      metrics,
      thresholds,
    };

    const prefix = `results/${config.runId}_${config.profileName}`;
    return {
      [`${prefix}_summary.json`]: JSON.stringify(data, null, 2),
      [`${prefix}.json`]: JSON.stringify(compact, null, 2),
      stdout: renderText(compact, config),
    };
  };
}
