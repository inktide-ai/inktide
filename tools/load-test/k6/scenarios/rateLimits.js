// Rate-limiter enforcement verification (limits profile only - this scenario
// deliberately violates budgets and poisons the shared IP window for ~60s).
//
// Three assertions, each recorded into limiter_enforced (threshold rate==1):
//   1. anonymous:  70-request burst must trip the 60 req/min/IP window
//   2. per-user:  310-request burst as one user must trip 300 req/min/user
//   3. tts:        25-request burst must trip the 20 req/60s/user window
//
// Bursts go through http.batch so they land inside the rate window
// deterministically regardless of endpoint latency.

import { createHttpClient } from '../clients/http.js';
import { ttsApi } from '../clients/ttsApi.js';
import { getToken } from '../clients/auth.js';
import { CONFIG } from '../lib/config.js';
import { limiterEnforced } from '../lib/metrics.js';
import { check } from 'k6';

const anonClient = createHttpClient({ baseUrl: CONFIG.baseUrl, defaultTags: { kind: 'api' } });
const authedClient = createHttpClient({
  baseUrl: CONFIG.baseUrl,
  tokenProvider: getToken,
  defaultTags: { kind: 'api' },
});

function saw429(responses) {
  return responses.some((r) => r.status === 429);
}

export function rateLimits() {
  const budgets = CONFIG.rateBudgets;

  const anonHit = saw429(
    anonClient.burst('GET', CONFIG.endpoints.chatProviders, null, budgets.anonPerMinPerIp + 10),
  );
  limiterEnforced.add(anonHit);
  check(null, { 'anon limiter enforced (60/min/IP)': () => anonHit });

  const authHit = saw429(
    authedClient.burst('GET', CONFIG.endpoints.mePreferences, null, budgets.authPerMinPerUser + 10),
  );
  limiterEnforced.add(authHit);
  check(null, { 'auth limiter enforced (300/min/user)': () => authHit });

  const ttsHit = saw429(ttsApi.burstSynthesize(budgets.ttsPerMinPerUser + 5));
  limiterEnforced.add(ttsHit);
  check(null, { 'tts limiter enforced (20/60s/user)': () => ttsHit });
}
