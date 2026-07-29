#!/usr/bin/env node
// Idempotently seeds the bench user pool (bench-user-0001 … bench-user-NNNN)
// via the Keycloak admin API and writes data/users.json (no secrets in it —
// the shared password stays in BENCH_USER_PASSWORD).
//
// Usage:
//   node scripts/seed-users.mjs [--count N]   # default: USER_POOL_SIZE or 5
//   node scripts/seed-users.mjs --delete      # purge bench-user-* accounts

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kcEnv, adminToken, adminClient, userToken, benchUsername } from './lib/keycloak.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const deleteMode = args.includes('--delete');
const countIdx = args.indexOf('--count');
const count = Number(
  countIdx >= 0 ? args[countIdx + 1] : process.env.USER_POOL_SIZE || 5,
);

const env = kcEnv();
const kc = adminClient(env, await adminToken(env));
const usersBase = `/realms/${env.realm}/users`;

async function findByUsername(username) {
  const res = await kc(`${usersBase}?username=${encodeURIComponent(username)}&exact=true`);
  return res.json?.[0] ?? null;
}

// ── Delete mode ───────────────────────────────────────────────────────────
if (deleteMode) {
  const res = await kc(`${usersBase}?username=bench-user-&max=2000`);
  const victims = (res.json || []).filter(
    (u) => /^bench-user-\d{4}$/.test(u.username) && u.attributes?.bench?.[0] === 'true',
  );
  for (const u of victims) {
    await kc(`${usersBase}/${u.id}`, { method: 'DELETE' });
    console.log(`deleted ${u.username}`);
  }
  console.log(`✓ removed ${victims.length} bench users`);
  process.exit(0);
}

// ── Seed mode ─────────────────────────────────────────────────────────────
if (!env.benchPassword) {
  console.error('seed-users: BENCH_USER_PASSWORD is required');
  process.exit(1);
}
if (!Number.isInteger(count) || count < 1) {
  console.error(`seed-users: invalid --count '${count}'`);
  process.exit(1);
}

let created = 0;
let existing = 0;
const users = [];

for (let i = 1; i <= count; i++) {
  const username = benchUsername(i);
  const res = await kc(usersBase, {
    method: 'POST',
    okStatuses: [409],
    body: {
      username,
      enabled: true,
      emailVerified: true,
      email: `${username}@bench.local`,
      firstName: 'Bench',
      lastName: `User ${String(i).padStart(4, '0')}`,
      attributes: { bench: ['true'] },
    },
  });
  res.status === 409 ? existing++ : created++;

  // Always (re)set the password so a changed BENCH_USER_PASSWORD converges.
  const user = await findByUsername(username);
  if (!user) throw new Error(`user ${username} not found after create`);
  await kc(`${usersBase}/${user.id}/reset-password`, {
    method: 'PUT',
    body: { type: 'password', value: env.benchPassword, temporary: false },
  });

  users.push({ username });
}

// Smoke-check the password grant end to end before declaring success.
await userToken(env, users[0].username, env.benchPassword);

mkdirSync(resolve(root, 'data'), { recursive: true });
writeFileSync(
  resolve(root, 'data/users.json'),
  JSON.stringify({ realm: env.realm, clientId: env.clientId, users }, null, 2),
);
console.log(
  `✓ pool ready: ${users.length} users (${created} created, ${existing} existing) → data/users.json`,
);
