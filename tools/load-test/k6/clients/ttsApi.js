// TTS synthesis client. Streaming responses are read fully as binary so
// tts_bytes stays measurable; res.timings.waiting is the product-meaningful
// time-to-first-byte for the streaming path.

import { createHttpClient } from './http.js';
import { CONFIG } from '../lib/config.js';
import { getToken } from './auth.js';

const client = createHttpClient({
  baseUrl: CONFIG.baseUrl,
  tokenProvider: getToken,
  defaultTags: { kind: 'api' },
});

function body({ stream, text }) {
  return {
    text: text ?? CONFIG.tts.text,
    voice_id: CONFIG.tts.voiceId,
    provider_id: CONFIG.tts.providerId,
    audio_format: CONFIG.tts.format,
    stream,
  };
}

export const ttsApi = {
  synthesize: ({ stream = true, text } = {}) =>
    client.post(CONFIG.endpoints.ttsSynthesize, body({ stream, text }), {
      responseType: 'binary',
      timeout: '60s',
    }),

  // Parallel burst for the limits profile: 25 short non-streaming calls must
  // trip the 20/60s per-user window.
  burstSynthesize: (n) =>
    client.burst('POST', CONFIG.endpoints.ttsSynthesize, body({ stream: false, text: 'ping' }), n, {
      responseType: 'none',
      timeout: '60s',
    }),
};
