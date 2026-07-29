#!/usr/bin/env node
// Creates (idempotently) one soul card owned by bench-user-0001 for the
// chatE2E scenario and prints its id as CHAT_CARD_ID.
//
// Flow: password-grant token → pick first LLM catalog entry →
//       POST /api/v1/souls/cards { name: "Bench Card", llmCatalogId }
//
// Usage: node scripts/seed-card.mjs   (requires BENCH_USER_PASSWORD + seeded pool)

import { kcEnv, userToken, benchUsername } from './lib/keycloak.mjs';

const CARD_NAME = 'Bench Card';
const baseUrl = (process.env.BASE_URL || 'http://localhost:5001').replace(/\/$/, '');

const env = kcEnv();
if (!env.benchPassword) {
  console.error('seed-card: BENCH_USER_PASSWORD is required');
  process.exit(1);
}

const { access_token } = await userToken(env, benchUsername(1), env.benchPassword);
const headers = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };

async function api(path, init = {}) {
  const res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new Error(`${init.method || 'GET'} ${path} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// Idempotency: reuse an existing bench card if present.
const existing = await api('/api/v1/souls/cards?limit=200');
const found = (existing.items || []).find((c) => c.name === CARD_NAME);
if (found) {
  console.log(`✓ card exists: ${found.id}`);
  console.log(`\nexport CHAT_CARD_ID=${found.id}`);
  process.exit(0);
}

const catalog = await api('/api/v1/soul/catalog/llm-models');
const models = Array.isArray(catalog) ? catalog : catalog.items || [];
if (models.length === 0) {
  console.error('seed-card: LLM catalog is empty — seed the catalog first');
  process.exit(1);
}

const card = await fetch(`${baseUrl}/api/v1/souls/cards`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ name: CARD_NAME, llmCatalogId: models[0].id }),
});
if (card.status !== 201) {
  console.error(`seed-card: create failed → ${card.status} ${await card.text()}`);
  process.exit(1);
}
const created = await card.json();
console.log(`✓ card created: ${created.id} (llm: ${models[0].id})`);
console.log(`\nexport CHAT_CARD_ID=${created.id}`);
