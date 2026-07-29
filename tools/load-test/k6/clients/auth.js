// Keycloak token client with per-VU state (each VU has an isolated JS runtime,
// so module-level state is per-VU by construction).
//
// Tokens are seeded from the pre-fetched pool (data/tokens.json) and refreshed
// ~60s before expiry via refresh_token grant, falling back to password grant -
// soak runs can outlive Keycloak's SSO idle timeout for refresh tokens.
//
// All Keycloak requests are tagged kind:auth so profile thresholds scoped to
// kind:api never include token traffic.

import http from 'k6/http';
import { CONFIG } from '../lib/config.js';
import { tokenRefreshes } from '../lib/metrics.js';
import { userForVu } from '../data/users.js';

const REFRESH_SKEW_MS = 60_000;

let state = null;

function tokenEndpoint() {
  const kc = CONFIG.keycloak;
  return `${kc.url}/realms/${kc.realm}/protocol/openid-connect/token`;
}

export function getToken() {
  if (state === null) {
    const u = userForVu();
    state = {
      username: u.username,
      token: u.access_token,
      refreshToken: u.refresh_token,
      expiresAt: u.expires_at,
    };
  }
  if (Date.now() >= state.expiresAt - REFRESH_SKEW_MS) {
    refresh();
  }
  return state.token;
}

function refresh() {
  const kc = CONFIG.keycloak;

  let res = http.post(
    tokenEndpoint(),
    {
      grant_type: 'refresh_token',
      client_id: kc.clientId,
      refresh_token: state.refreshToken,
    },
    { tags: { name: 'kc_token_refresh', kind: 'auth' } },
  );

  if (res.status !== 200 && CONFIG.benchUserPassword) {
    res = http.post(
      tokenEndpoint(),
      {
        grant_type: 'password',
        client_id: kc.clientId,
        username: state.username,
        password: CONFIG.benchUserPassword,
      },
      { tags: { name: 'kc_token_password', kind: 'auth' } },
    );
  }

  if (res.status !== 200) {
    throw new Error(`token refresh failed for ${state.username}: ${res.status} ${res.body}`);
  }

  const body = res.json();
  state.token = body.access_token;
  state.refreshToken = body.refresh_token || state.refreshToken;
  state.expiresAt = Date.now() + body.expires_in * 1000;
  tokenRefreshes.add(1);
}
