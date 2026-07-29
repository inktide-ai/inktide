// Canary probe: alternates /health/live and /health/ready at a fixed cadence.
// One request per iteration so the configured arrival rate equals the request
// rate — the guard math in scripts/preflight.mjs depends on that.

import exec from 'k6/execution';
import { publicApi } from '../clients/publicApi.js';
import { expectStatus } from '../lib/checks.js';
import { anon429, healthReadySuccess } from '../lib/metrics.js';

export function health() {
  const probeReady = exec.scenario.iterationInTest % 2 === 1;
  const res = probeReady ? publicApi.healthReady() : publicApi.healthLive();

  if (probeReady) {
    healthReadySuccess.add(expectStatus(res, 200, 'health ready'));
  } else {
    expectStatus(res, 200, 'health live');
  }
  anon429.add(res.status === 429);
}
