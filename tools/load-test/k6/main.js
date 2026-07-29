// Single k6 entrypoint. Profile selection: k6 run -e PROFILE=<name> k6/main.js
// (normally via scripts/run.sh, which also runs the rate-budget preflight).
//
// options.scenarios is assembled from the profile; each enabled scenario's
// `exec` must match a named export below. Adding a scenario = one file in
// scenarios/, one re-export here, one entry per profile.

import { CONFIG, buildScenarios } from './lib/config.js';
import { makeHandleSummary } from './lib/summary.js';
import { createHttpClient } from './clients/http.js';

export { health } from './scenarios/health.js';
export { publicRest } from './scenarios/publicRest.js';
export { authCrud } from './scenarios/authCrud.js';
export { ttsStream } from './scenarios/ttsStream.js';
export { chatE2E } from './scenarios/chatE2E.js';
export { rateLimits } from './scenarios/rateLimits.js';

export const options = {
  scenarios: buildScenarios(CONFIG),
  thresholds: CONFIG.thresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  tags: { suite: 'inktide-load-test' },
};

export function setup() {
  // Fail fast: the whole run is meaningless if the target is unreachable.
  const client = createHttpClient({ baseUrl: CONFIG.baseUrl });
  const res = client.get(CONFIG.endpoints.healthLive, { tags: { name: 'setup' } });
  if (res.status !== 200) {
    throw new Error(
      `API unreachable: GET ${CONFIG.baseUrl}${CONFIG.endpoints.healthLive} → ${res.status || res.error}`,
    );
  }
}

export const handleSummary = makeHandleSummary(CONFIG);
