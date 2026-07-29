// Streaming TTS synthesis. Closed-form measurement per request:
//   tts_ttfb_ms  — time to first streamed byte (product-meaningful: this is
//                  when audio playback could start)
//   tts_total_ms — full stream duration
// Arrival rate must respect the 20 req/60s per-user window; preflight enforces
// rate/poolSize ≤ 0.25 req/s/user.

import { ttsApi } from '../clients/ttsApi.js';
import { expectStatus } from '../lib/checks.js';
import { tts429, ttsTtfbMs, ttsTotalMs, ttsBytes } from '../lib/metrics.js';

export function ttsStream() {
  const res = ttsApi.synthesize({ stream: true });

  expectStatus(res, 200, 'tts synthesize');
  tts429.add(res.status === 429);

  if (res.status === 200) {
    ttsTtfbMs.add(res.timings.waiting);
    ttsTotalMs.add(res.timings.duration);
    if (res.body) {
      ttsBytes.add(res.body.byteLength || 0);
    }
  }
}
