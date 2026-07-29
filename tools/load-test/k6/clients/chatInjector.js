// Chat message injection port with two adapters, selected by CHAT_INJECTOR:
//
//   http (default) — POST /api/v1/connectors/inktide/messages. Exercises the
//     real user-facing surface; channelId ownership and rate limits apply
//     naturally. Returns the k6 http response (202 = accepted).
//
//   redis — XADD to synapse.ingest with the exact message shape used by
//     tools/pipeline-bench, for cross-validation against its numbers.
//     Needs REDIS_URL reachable from the load generator.

import redis from 'k6/x/redis';
import { CONFIG } from '../lib/config.js';
import { createHttpClient } from './http.js';
import { getToken } from './auth.js';

const httpClient = createHttpClient({
  baseUrl: CONFIG.baseUrl,
  tokenProvider: getToken,
  defaultTags: { kind: 'api' },
});

// k6 redis clients must be constructed in the init context.
const redisClient = CONFIG.chatInjector === 'redis' ? new redis.Client(CONFIG.redisUrl) : null;

function httpInject(channelId, text) {
  const res = httpClient.post(CONFIG.endpoints.chatSend, { channelId, text });
  return Promise.resolve({ ok: res.status === 202, status: res.status });
}

async function redisInject(channelId, text) {
  const now = new Date().toISOString();
  // Mirror of tools/pipeline-bench/bench.js message shape.
  const message = {
    platformId: 'discord',
    channelId,
    channelName: 'benchmark',
    sender: {
      userId: 'bench',
      userName: 'benchmark',
      badges: [],
      isModerator: false,
      isSubscriber: false,
      isVip: false,
      isBroadcaster: false,
    },
    text,
    timestamp: now,
    stream: { channelId, status: 2, startedAt: now },
  };
  await redisClient.sendCommand('XADD', 'synapse.ingest', '*', 'payload', JSON.stringify(message));
  return { ok: true, status: 202 };
}

// sendChatMessage(channelId, text) → Promise<{ ok, status }>
export const sendChatMessage = CONFIG.chatInjector === 'redis' ? redisInject : httpInject;
