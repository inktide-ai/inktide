// End-to-end chat pipeline over the real user surface:
//   inject message → Redis synapse.ingest → LlmStreamWorker → SignalR events
//
// Closed model (constant-vus) by design: each VU runs full sessions and waits
// for the pipeline to answer before sending the next message. An open model
// would pile unbounded work onto the GPU-bound LLM queue and measure queue
// explosion, not capacity.
//
// One iteration = one session: connect → JoinChannel → N message exchanges →
// close. k6's event loop must drain before an iteration ends, so a WS
// connection cannot outlive its iteration — sessions, not single messages,
// keep the connect overhead amortized and realistic.
//
// Each VU has its own channel ({cardId}:{userId}); one in-flight message per
// channel means no correlation-id plumbing is needed.
//
// CI mode: with CHAT_CARD_ID unset the scenario degrades to a connect +
// JoinChannel handshake check — validates auth, WS upgrade and hub protocol
// without needing LLM/TTS workers.

import { b64decode } from 'k6/encoding';
import { setTimeout, clearTimeout } from 'k6/timers';
import { check } from 'k6';
import { CONFIG } from '../lib/config.js';
import { getToken } from '../clients/auth.js';
import { connectHub } from '../clients/signalr.js';
import { sendChatMessage } from '../clients/chatInjector.js';
import {
  chatFirstTokenMs,
  chatFirstAudioMs,
  chatTotalMs,
  chatAudioChunks,
  chatSloViolations,
  chatTimeouts,
  chatWsErrors,
  signalrHandshakeOk,
} from '../lib/metrics.js';

function subFromJwt(token) {
  return JSON.parse(b64decode(token.split('.')[1], 'rawurl', 's')).sub;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runExchange(hub, channelId) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let firstToken = 0;
    let firstAudio = 0;
    let chunks = 0;
    let done = false;

    const deadline = setTimeout(() => finish(true), CONFIG.slo.chatTimeoutMs);

    function finish(timedOut) {
      if (done) return;
      done = true;
      clearTimeout(deadline);
      hub.off(CONFIG.hubEvents.textChunk);
      hub.off(CONFIG.hubEvents.audioReceived);

      chatTimeouts.add(timedOut);
      if (!timedOut) {
        const total = Date.now() - t0;
        chatTotalMs.add(total);
        chatSloViolations.add(total > CONFIG.slo.chatTotalMs);
        if (firstToken > 0) chatFirstTokenMs.add(firstToken - t0);
        if (firstAudio > 0) chatFirstAudioMs.add(firstAudio - t0);
        chatAudioChunks.add(chunks);
      }
      resolve(!timedOut);
    }

    hub.on(CONFIG.hubEvents.textChunk, () => {
      if (firstToken === 0) firstToken = Date.now();
    });

    hub.on(CONFIG.hubEvents.audioReceived, (payload) => {
      chunks++;
      if (firstAudio === 0) firstAudio = Date.now();
      if (payload && payload.isLast) finish(false);
    });

    // Handlers armed — inject.
    sendChatMessage(channelId, `Answer briefly: what does the tide carry? (${t0})`)
      .then((r) => {
        if (!r.ok) {
          chatWsErrors.add(1);
          finish(true);
        }
      })
      .catch(() => {
        chatWsErrors.add(1);
        finish(true);
      });
  });
}

export async function chatE2E() {
  const token = getToken();
  const userId = subFromJwt(token);
  const handshakeOnly = CONFIG.chatCardId === '';
  const channelId = handshakeOnly
    ? `bench-handshake:${userId}`
    : `${CONFIG.chatCardId}:${userId}`;

  let hub;
  try {
    hub = await connectHub(
      `${CONFIG.wsUrl}${CONFIG.endpoints.audioHub}?access_token=${token}`,
    );
    signalrHandshakeOk.add(true);
  } catch (e) {
    signalrHandshakeOk.add(false);
    chatWsErrors.add(1);
    check(null, { 'signalr connect': () => false });
    return;
  }

  hub.onError = () => chatWsErrors.add(1);

  try {
    await hub.invoke('JoinChannel', [channelId]);
    check(null, { 'signalr connect': () => true, 'join channel': () => true });

    if (handshakeOnly) return;

    for (let i = 0; i < CONFIG.chat.messagesPerSession; i++) {
      if (hub.closed) break;
      await runExchange(hub, channelId);
      await delay(CONFIG.chat.cooldownSeconds * 1000);
    }
  } catch (e) {
    chatWsErrors.add(1);
    check(null, { 'join channel': () => false });
  } finally {
    hub.close();
  }
}
