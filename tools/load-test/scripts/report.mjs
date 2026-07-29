#!/usr/bin/env node
// Result rendering, CI gate, run comparison and baseline promotion for the
// compact result schema written by k6 handleSummary and bombardier.sh.
//
// Usage:
//   node scripts/report.mjs <result.json>                 formatted table
//   node scripts/report.mjs <result.json> --ci            key=value + exit 1 on FAIL
//   node scripts/report.mjs compare <base> <new> [--tolerance 10]
//   node scripts/report.mjs promote <result.json>         -> baselines/<profile>.json

import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('usage: report.mjs <file> [--ci] | compare <a> <b> [--tolerance N] | promote <file>');
  process.exit(1);
}

const load = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'));
const fmtMs = (x) =>
  typeof x !== 'number' || !isFinite(x) ? '-' : x >= 1000 ? `${(x / 1000).toFixed(2)}s` : `${x.toFixed(1)}ms`;
const pct = (x) => `${(x * 100).toFixed(2)}%`;
const LINE = '-'.repeat(76);

// -- compare ---------------------------------------------------------------
if (args[0] === 'compare') {
  const [, fileA, fileB] = args;
  const tolIdx = args.indexOf('--tolerance');
  const tolerance = tolIdx >= 0 ? Number(args[tolIdx + 1]) : 10;

  const a = load(fileA);
  const b = load(fileB);
  const regressions = [];

  console.log(LINE);
  console.log(` compare  base=${fileA} (${a.ts || '?'})`);
  console.log(`          new =${fileB} (${b.ts || '?'})   tolerance ±${tolerance}%`);
  console.log(LINE);

  for (const [name, ma] of Object.entries(a.metrics || {})) {
    const mb = b.metrics?.[name];
    if (!mb) continue;

    if (ma.type === 'trend' && typeof ma.p95 === 'number' && typeof mb.p95 === 'number' && ma.p95 > 0) {
      const delta = ((mb.p95 - ma.p95) / ma.p95) * 100;
      const bad = delta > tolerance;
      if (bad) regressions.push(`${name} p95 +${delta.toFixed(1)}%`);
      console.log(
        `  ${bad ? '✗' : ' '} ${name.padEnd(36)} p95 ${fmtMs(ma.p95).padStart(9)} → ${fmtMs(mb.p95).padStart(9)}  ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`,
      );
    }

    // Failure-shaped rates: any growth beyond 1pp is a regression.
    if (ma.type === 'rate' && /failed|429|violation|timeout/.test(name)) {
      const delta = (mb.rate || 0) - (ma.rate || 0);
      const bad = delta > 0.01;
      if (bad) regressions.push(`${name} rate +${(delta * 100).toFixed(1)}pp`);
      console.log(
        `  ${bad ? '✗' : ' '} ${name.padEnd(36)} rate ${pct(ma.rate || 0).padStart(8)} → ${pct(mb.rate || 0).padStart(8)}`,
      );
    }
  }

  console.log(LINE);
  if (regressions.length > 0) {
    console.log(` REGRESSIONS (${regressions.length}):`);
    for (const r of regressions) console.log(`   ✗ ${r}`);
    process.exit(1);
  }
  console.log(' ✓ no regressions beyond tolerance');
  process.exit(0);
}

// -- promote ---------------------------------------------------------------
if (args[0] === 'promote') {
  const file = args[1];
  const data = load(file);
  const dest = resolve(root, `baselines/${data.profile}.json`);
  mkdirSync(resolve(root, 'baselines'), { recursive: true });
  copyFileSync(resolve(root, file), dest);
  console.log(`✓ promoted ${file} → baselines/${data.profile}.json`);
  process.exit(0);
}

// -- report / --ci ---------------------------------------------------------
const data = load(args[0]);
const ci = args.includes('--ci');

if (ci) {
  console.log(`tool=${data.tool}`);
  console.log(`profile=${data.profile}`);
  for (const [name, m] of Object.entries(data.metrics || {})) {
    if (m.type === 'trend') console.log(`${name}_p95=${m.p95}`);
    if (m.type === 'rate') console.log(`${name}_rate=${m.rate}`);
    if (m.type === 'counter') console.log(`${name}_count=${m.count}`);
  }
  const failed = Object.entries(data.thresholds || {}).flatMap(([metric, exprs]) =>
    Object.entries(exprs).filter(([, s]) => !s.ok).map(([expr]) => `${metric}: ${expr}`),
  );
  for (const f of failed) console.log(`threshold_failed=${f}`);
  console.log(`status=${data.passed ? 'PASS' : 'FAIL'}`);
  process.exit(data.passed ? 0 : 1);
}

console.log(LINE);
console.log(` ${data.tool} · profile=${data.profile} · ${data.ts}` + (data.git_sha ? ` · ${data.git_sha}` : ''));
console.log(` target: ${data.base_url || '-'}`);
console.log(LINE);

if (data.tool === 'bombardier') {
  for (const t of data.targets || []) {
    console.log(` ${t.name}  (-c ${t.connections}, ${t.duration}${t.rate ? `, --rate ${t.rate}` : ''})`);
    console.log(`   rps    mean ${t.rps.mean.toFixed(0).padStart(8)}   max ${t.rps.max.toFixed(0).padStart(8)}`);
    console.log(
      `   lat    p50 ${fmtMs(t.latency_ms.p50).padStart(9)}  p95 ${fmtMs(t.latency_ms.p95).padStart(9)}  p99 ${fmtMs(t.latency_ms.p99).padStart(9)}  max ${fmtMs(t.latency_ms.max).padStart(9)}`,
    );
    console.log(
      `   status 2xx ${String(t.status['2xx']).padStart(8)}   4xx ${String(t.status['4xx']).padStart(8)}   5xx ${String(t.status['5xx']).padStart(8)}`,
    );
    console.log('');
  }
} else {
  const t = data.thresholds || {};
  const total = Object.values(t).reduce((n, m) => n + Object.keys(m).length, 0);
  const failed = Object.values(t).reduce((n, m) => n + Object.values(m).filter((s) => !s.ok).length, 0);
  console.log(` THRESHOLDS  ${data.passed ? 'PASS' : 'FAIL'} (${total - failed}/${total})`);
  for (const [metric, exprs] of Object.entries(t)) {
    for (const [expr, st] of Object.entries(exprs)) {
      console.log(`   ${st.ok ? '✓' : '✗'} ${metric.padEnd(46)} ${expr}`);
    }
  }
  console.log('');
  console.log(' METRICS');
  for (const [name, m] of Object.entries(data.metrics || {})) {
    if (m.type === 'trend') {
      console.log(
        `   ${name.padEnd(34)} p50 ${fmtMs(m.p50).padStart(9)}  p95 ${fmtMs(m.p95).padStart(9)}  p99 ${fmtMs(m.p99).padStart(9)}`,
      );
    } else if (m.type === 'rate') {
      console.log(`   ${name.padEnd(34)} rate ${pct(m.rate || 0).padStart(8)}`);
    } else if (m.type === 'counter') {
      console.log(`   ${name.padEnd(34)} count ${String(m.count).padStart(9)}  (${m.rate}/s)`);
    }
  }
}
console.log(LINE);
process.exit(data.passed ? 0 : 1);
