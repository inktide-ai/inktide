// Single registry of every custom instrument in the suite.
// Scenarios and clients import from here; nothing else calls `new Trend(...)`.
// A metric that receives no samples in a given profile simply doesn't appear
// in the summary — defining the full set up front is harmless and keeps
// threshold names stable across profiles.

import { Counter, Rate, Trend } from 'k6/metrics';

// ── Rate-limiter observability ────────────────────────────────────────────
export const anon429 = new Rate('anon_429'); // any anonymous 429 = budget math is wrong
export const crud429 = new Rate('crud_429'); // early warning that pool sizing eroded
export const tts429 = new Rate('tts_429');
export const limiterEnforced = new Rate('limiter_enforced'); // limits profile only

// ── Health ────────────────────────────────────────────────────────────────
export const healthReadySuccess = new Rate('health_ready_success');

// ── Auth ──────────────────────────────────────────────────────────────────
export const tokenRefreshes = new Counter('token_refreshes');

// ── TTS streaming ─────────────────────────────────────────────────────────
export const ttsTtfbMs = new Trend('tts_ttfb_ms', true); // time to first streamed byte
export const ttsTotalMs = new Trend('tts_total_ms', true);
export const ttsBytes = new Counter('tts_bytes');

// ── Chat E2E (publish → SignalR events) ───────────────────────────────────
export const chatFirstTokenMs = new Trend('chat_first_token_ms', true);
export const chatFirstAudioMs = new Trend('chat_first_audio_ms', true);
export const chatTotalMs = new Trend('chat_total_ms', true);
export const chatAudioChunks = new Counter('chat_audio_chunks');
export const chatSloViolations = new Rate('chat_slo_violations');
export const chatTimeouts = new Rate('chat_timeouts');
export const chatWsErrors = new Counter('chat_ws_errors');
export const signalrHandshakeOk = new Rate('signalr_handshake_ok');
