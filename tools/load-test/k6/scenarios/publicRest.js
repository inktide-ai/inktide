// Anonymous catalog traffic under the shared 60 req/min/IP budget.
// One request per iteration, endpoint picked from a deterministic weighted
// ring — the mix stays stable regardless of VU scheduling, and arrival rate
// equals request rate for the preflight budget math.
//
// Optional members of the mix (both proxy to live backends):
//   ttsVoices — joins when TTS_VOICES_PROVIDER is set (needs that provider up)
//   demoChat  — joins when DEMO_LLM=1 (needs Ollama); 1/10 weight keeps it
//               under its 5 req/min/IP cap at any scenario rate ≤ 50/min

import exec from 'k6/execution';
import { publicApi } from '../clients/publicApi.js';
import { CONFIG } from '../lib/config.js';
import { expectStatus, expectJson } from '../lib/checks.js';
import { anon429 } from '../lib/metrics.js';

const RING = buildRing();

function buildRing() {
  const slots = [];
  if (CONFIG.demoLlm) slots.push('demoChat');
  if (CONFIG.ttsVoicesProvider) slots.push('ttsVoices', 'ttsVoices');
  while (slots.length < 10) {
    slots.push(slots.length % 2 === 0 ? 'chatProviders' : 'ttsProviders');
  }
  return slots;
}

export function publicRest() {
  const pick = RING[exec.scenario.iterationInTest % RING.length];
  let res;

  switch (pick) {
    case 'demoChat':
      res = publicApi.demoChat('Reply with one short sentence.');
      expectStatus(res, 200, 'demo chat');
      break;
    case 'ttsVoices':
      res = publicApi.ttsVoices(CONFIG.ttsVoicesProvider);
      expectStatus(res, 200, 'tts voices');
      break;
    case 'ttsProviders':
      res = publicApi.ttsProviders();
      expectStatus(res, 200, 'tts providers');
      expectJson(res, 'tts providers', (b) => Array.isArray(b));
      break;
    default:
      res = publicApi.chatProviders();
      expectStatus(res, 200, 'chat providers');
      expectJson(res, 'chat providers', (b) => Array.isArray(b));
      break;
  }

  anon429.add(res.status === 429);
}
