#!/usr/bin/env node
// Static rate-budget guard. Refuses load shapes that would trip the API's
// rate limiter and poison the measurement — the suite must never require
// touching the API's production rate-limit config.
//
// Budgets (from src/Inktide.API/Deployment/TtsRateLimiterStartup.cs, mirrored
// in config/default.json):
//   anonymous:      60 req/min per IP   (shared by ALL traffic from this host)
//   authenticated: 300 req/min per user (sliding window, partitioned by sub)
//   tts synthesize: 20 req/60s per user
//
// Guard margins: auth ≤ 80% of budget, tts ≤ 75%, anon abort > 90% / warn > 80%.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profileName = process.env.PROFILE || 'smoke';

const defaults = JSON.parse(readFileSync(resolve(root, 'config/default.json'), 'utf8'));
const profilePath = resolve(root, `config/profiles/${profileName}.json`);
if (!existsSync(profilePath)) {
  console.error(`preflight: unknown profile '${profileName}' (no ${profilePath})`);
  process.exit(1);
}
const profile = JSON.parse(readFileSync(profilePath, 'utf8'));

const poolSize = Number(process.env.USER_POOL_SIZE || profile.userPool?.size || 0);
const budgets = defaults.rateBudgets;

function timeUnitSeconds(tu = '1s') {
  const m = /^(\d+)(ms|s|m|h)$/.exec(tu);
  if (!m) throw new Error(`unsupported timeUnit: ${tu}`);
  const n = Number(m[1]);
  return { ms: n / 1000, s: n, m: n * 60, h: n * 3600 }[m[2]];
}

// Peak request rate (req/s) a scenario can generate. Closed-model executors
// (constant-vus, per-vu-iterations) self-throttle on response time and can't
// be bounded statically → null.
function peakRatePerSec(sc) {
  const unit = timeUnitSeconds(sc.timeUnit || '1s');
  if (sc.executor === 'constant-arrival-rate') return sc.rate / unit;
  if (sc.executor === 'ramping-arrival-rate') {
    const peak = Math.max(sc.startRate || 0, ...(sc.stages || []).map((st) => st.target));
    return peak / unit;
  }
  return null;
}

const errors = [];
const warnings = [];
let anonPerMin = 0;
let authPerUserPerSec = 0;
let anyAuthEnabled = false;

for (const [name, sc] of Object.entries(profile.scenarios || {})) {
  if (!sc?.enabled) continue;
  const meta = defaults.scenarioMeta[name] || {};
  if (meta.auth) anyAuthEnabled = true;
  if (meta.exemptFromGuard) continue;

  const rps = peakRatePerSec(sc);
  if (rps === null) continue;

  if (!meta.auth) {
    anonPerMin += rps * 60;
    continue;
  }

  if (poolSize <= 0) {
    errors.push(`${name}: authenticated scenario enabled but user pool size is 0 (set userPool.size or USER_POOL_SIZE)`);
    continue;
  }

  const perUser = rps / poolSize;
  if (meta.perUserBudget === 'tts') {
    const cap = (budgets.ttsPerMinPerUser / 60) * 0.75;
    if (perUser > cap) {
      errors.push(
        `${name}: ${rps.toFixed(2)} req/s over ${poolSize} users = ${perUser.toFixed(3)} req/s/user ` +
        `> ${cap.toFixed(3)} (75% of ${budgets.ttsPerMinPerUser}/min TTS cap). Grow the pool or lower the rate.`,
      );
    }
  } else {
    authPerUserPerSec += perUser;
  }
}

const authCap = (budgets.authPerMinPerUser / 60) * 0.8; // 4 req/s/user
if (authPerUserPerSec > authCap) {
  errors.push(
    `authenticated scenarios sum to ${authPerUserPerSec.toFixed(2)} req/s/user ` +
    `> ${authCap.toFixed(2)} (80% of ${budgets.authPerMinPerUser}/min/user). ` +
    `Grow USER_POOL_SIZE (currently ${poolSize}) or lower rates.`,
  );
}

const anonCap = budgets.anonPerMinPerIp;
if (anonPerMin > anonCap * 0.9) {
  errors.push(
    `anonymous scenarios sum to ${anonPerMin.toFixed(1)} req/min > ${(anonCap * 0.9).toFixed(0)} ` +
    `(90% of the ${anonCap}/min/IP budget — ALL traffic from this host shares it).`,
  );
} else if (anonPerMin > anonCap * 0.8) {
  warnings.push(
    `anonymous scenarios sum to ${anonPerMin.toFixed(1)} req/min — over 80% of the ${anonCap}/min/IP budget. ` +
    `Any other traffic from this host (browser tabs, curl) will cause 429s.`,
  );
}

// Authenticated scenarios need the pre-fetched token pool on disk.
if (anyAuthEnabled) {
  const tokensPath = resolve(root, 'data/tokens.json');
  if (!existsSync(tokensPath)) {
    errors.push(
      `data/tokens.json missing — run: node scripts/seed-users.mjs && node scripts/fetch-tokens.mjs`,
    );
  } else {
    const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
    if (!Array.isArray(tokens) || tokens.length < poolSize) {
      errors.push(
        `data/tokens.json has ${Array.isArray(tokens) ? tokens.length : 0} tokens < pool size ${poolSize} — ` +
        `re-run: node scripts/fetch-tokens.mjs`,
      );
    }
  }
}

for (const w of warnings) console.warn(`preflight ⚠ ${w}`);
if (errors.length > 0) {
  for (const e of errors) console.error(`preflight ✗ ${e}`);
  process.exit(1);
}
console.log(
  `preflight ✓ profile=${profileName} anon=${anonPerMin.toFixed(1)}/min ` +
  `authPerUser=${authPerUserPerSec.toFixed(2)}/s pool=${poolSize}`,
);
