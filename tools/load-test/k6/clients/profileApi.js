// Authenticated CRUD surface used by the authCrud mix.
// kind:api tag scopes profile thresholds to real API traffic (auth.js tags
// its Keycloak calls kind:auth).

import { createHttpClient } from './http.js';
import { CONFIG } from '../lib/config.js';
import { getToken } from './auth.js';

const client = createHttpClient({
  baseUrl: CONFIG.baseUrl,
  tokenProvider: getToken,
  defaultTags: { kind: 'api' },
});
const ep = CONFIG.endpoints;

export const profileApi = {
  me: () => client.get(ep.me),
  getPreferences: () => client.get(ep.mePreferences),
  patchPreferences: (patch) => client.patch(ep.mePreferences, patch),
  projects: () => client.get(ep.projects),
  soulsCards: () => client.get(ep.soulsCards),
};

// Re-exported for scenarios that need ad-hoc authenticated calls (rateLimits).
export const authedClient = client;
