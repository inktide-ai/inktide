// Shared Keycloak helpers for the seeding scripts (Node ≥ 20, global fetch).
// Admin auth resolution, in order:
//   1. KC_ADMIN_CLIENT_ID + KC_ADMIN_CLIENT_SECRET → client-credentials grant
//      on the target realm (staging: confidential client with manage-users)
//   2. KC_ADMIN_USER + KC_ADMIN_PASSWORD → password grant on admin-cli in the
//      master realm (local/CI: the compose KEYCLOAK_ADMIN account)

export function kcEnv() {
  const url = (process.env.KC_URL || 'http://localhost:8080').replace(/\/$/, '');
  return {
    url,
    realm: process.env.KC_REALM || 'chimera',
    clientId: process.env.KC_CLIENT_ID || 'chimera-web',
    benchPassword: process.env.BENCH_USER_PASSWORD || '',
  };
}

export async function adminToken(env) {
  const { KC_ADMIN_CLIENT_ID, KC_ADMIN_CLIENT_SECRET, KC_ADMIN_USER, KC_ADMIN_PASSWORD } = process.env;

  let tokenUrl;
  let body;
  if (KC_ADMIN_CLIENT_ID && KC_ADMIN_CLIENT_SECRET) {
    tokenUrl = `${env.url}/realms/${env.realm}/protocol/openid-connect/token`;
    body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: KC_ADMIN_CLIENT_ID,
      client_secret: KC_ADMIN_CLIENT_SECRET,
    });
  } else if (KC_ADMIN_USER && KC_ADMIN_PASSWORD) {
    tokenUrl = `${env.url}/realms/master/protocol/openid-connect/token`;
    body = new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: KC_ADMIN_USER,
      password: KC_ADMIN_PASSWORD,
    });
  } else {
    throw new Error(
      'no admin credentials: set KC_ADMIN_USER/KC_ADMIN_PASSWORD (local) or KC_ADMIN_CLIENT_ID/KC_ADMIN_CLIENT_SECRET (staging)',
    );
  }

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`admin token failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()).access_token;
}

// Thin admin-API client bound to a token. Returns parsed JSON (or null for
// empty bodies); throws with response text on any non-2xx except those listed
// in okStatuses.
export function adminClient(env, token) {
  return async function kcFetch(path, { method = 'GET', body, okStatuses = [] } = {}) {
    const res = await fetch(`${env.url}/admin${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok && !okStatuses.includes(res.status)) {
      throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
    }
    const text = await res.text();
    return { status: res.status, json: text ? JSON.parse(text) : null };
  };
}

// Password-grant user token against the public client. Used by fetch-tokens
// and (as a smoke check) by seed-users.
export async function userToken(env, username, password) {
  const res = await fetch(`${env.url}/realms/${env.realm}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: env.clientId,
      username,
      password,
    }),
  });
  if (!res.ok) {
    throw new Error(`password grant failed for ${username}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export function benchUsername(i) {
  return `bench-user-${String(i).padStart(4, '0')}`;
}
