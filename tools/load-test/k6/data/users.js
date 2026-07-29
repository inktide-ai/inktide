// Token pool loading + VU->user assignment.
// SharedArray keeps one read-only copy across all VUs. The modulo assignment
// is stable and deterministic, which keeps per-user request rates predictable
// for the rate-limit budget math in scripts/preflight.mjs.
//
// The pool file is optional at init time (anonymous-only profiles must run
// without it); userForVu() throws a actionable error if an authenticated
// scenario runs with an empty pool.

import { SharedArray } from 'k6/data';
import exec from 'k6/execution';

let pool;
try {
  pool = new SharedArray('bench-tokens', () => JSON.parse(open('../../data/tokens.json')));
} catch (_) {
  pool = [];
}

export function userForVu() {
  if (pool.length === 0) {
    throw new Error(
      'token pool empty — run: node scripts/seed-users.mjs && node scripts/fetch-tokens.mjs',
    );
  }
  return pool[(exec.vu.idInTest - 1) % pool.length];
}

export function poolSize() {
  return pool.length;
}
