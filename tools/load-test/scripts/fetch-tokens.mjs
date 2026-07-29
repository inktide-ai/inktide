#!/usr/bin/env node
// Pre-fetches password-grant tokens for the whole pool → data/tokens.json.
// Done in Node (not k6 setup()) so k6 startup stays fast for large pools and
// bombardier.sh can reuse the same file.
//
// Usage: node scripts/fetch-tokens.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kcEnv, userToken, benchUsername } from './lib/keycloak.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const usersPath = resolve(root, 'data/users.json');

const env = kcEnv();
if (!env.benchPassword) {
  console.error('fetch-tokens: BENCH_USER_PASSWORD is required');
  process.exit(1);
}

// Against a pre-seeded environment (staging CI) data/users.json isn't on
// disk — synthesize the canonical bench-user list from USER_POOL_SIZE.
let users;
if (existsSync(usersPath)) {
  ({ users } = JSON.parse(readFileSync(usersPath, 'utf8')));
} else if (process.env.USER_POOL_SIZE) {
  const n = Number(process.env.USER_POOL_SIZE);
  users = Array.from({ length: n }, (_, i) => ({ username: benchUsername(i + 1) }));
  console.log(`data/users.json missing — assuming pre-seeded pool of ${n} users`);
} else {
  console.error('fetch-tokens: data/users.json missing — run scripts/seed-users.mjs first (or set USER_POOL_SIZE for a pre-seeded environment)');
  process.exit(1);
}
const CONCURRENCY = 5;
const tokens = [];
let failed = 0;

for (let i = 0; i < users.length; i += CONCURRENCY) {
  const batch = users.slice(i, i + CONCURRENCY);
  const results = await Promise.allSettled(
    batch.map(async ({ username }) => {
      const t = await userToken(env, username, env.benchPassword);
      return {
        username,
        access_token: t.access_token,
        refresh_token: t.refresh_token,
        expires_at: Date.now() + t.expires_in * 1000,
      };
    }),
  );
  for (const r of results) {
    if (r.status === 'fulfilled') {
      tokens.push(r.value);
    } else {
      failed++;
      console.error(`✗ ${r.reason.message}`);
    }
  }
  process.stdout.write(`\rtokens: ${tokens.length}/${users.length}`);
}
console.log('');

if (failed > 0) {
  console.error(`fetch-tokens: ${failed} grants failed`);
  process.exit(1);
}

mkdirSync(resolve(root, 'data'), { recursive: true });
writeFileSync(resolve(root, 'data/tokens.json'), JSON.stringify(tokens, null, 2));
console.log(`✓ ${tokens.length} tokens → data/tokens.json`);
