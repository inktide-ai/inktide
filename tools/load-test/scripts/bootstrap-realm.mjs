#!/usr/bin/env node
// Idempotently ensures the target realm and public client exist and that the
// client allows the password grant (directAccessGrantsEnabled).
//
// Locally this is a no-op (the chimera realm is hand-built); in CI it creates
// the realm from scratch — there is no realm export in the repo, this script
// is what makes the smoke job self-contained.
//
// Usage: node scripts/bootstrap-realm.mjs

import { kcEnv, adminToken, adminClient } from './lib/keycloak.mjs';

const env = kcEnv();
const kc = adminClient(env, await adminToken(env));

// ── Realm ─────────────────────────────────────────────────────────────────
const realm = await kc(`/realms/${env.realm}`, { okStatuses: [404] });
if (realm.status === 404) {
  await kc('/realms', {
    method: 'POST',
    body: {
      realm: env.realm,
      enabled: true,
      registrationAllowed: false,
      // Match production-ish token lifetimes so refresh behavior is realistic.
      accessTokenLifespan: 300,
    },
  });
  console.log(`realm ✓ created '${env.realm}'`);
} else {
  console.log(`realm ✓ '${env.realm}' exists`);
}

// ── Public client with password grant ─────────────────────────────────────
const clients = await kc(`/realms/${env.realm}/clients?clientId=${encodeURIComponent(env.clientId)}`);
const existing = clients.json?.[0];

if (!existing) {
  await kc(`/realms/${env.realm}/clients`, {
    method: 'POST',
    body: {
      clientId: env.clientId,
      publicClient: true,
      directAccessGrantsEnabled: true,
      standardFlowEnabled: true,
      redirectUris: ['http://localhost:3000/*'],
      webOrigins: ['http://localhost:3000'],
    },
  });
  console.log(`client ✓ created '${env.clientId}' (directAccessGrants on)`);
} else if (!existing.directAccessGrantsEnabled) {
  await kc(`/realms/${env.realm}/clients/${existing.id}`, {
    method: 'PUT',
    body: { ...existing, directAccessGrantsEnabled: true },
  });
  console.log(`client ✓ '${env.clientId}' updated: directAccessGrants enabled`);
} else {
  console.log(`client ✓ '${env.clientId}' ok`);
}
