// Unauthenticated API surface: health probes + public catalogs + demo chat.

import { createHttpClient } from './http.js';
import { CONFIG } from '../lib/config.js';

const client = createHttpClient({ baseUrl: CONFIG.baseUrl });
const ep = CONFIG.endpoints;

export const publicApi = {
  healthLive: () => client.get(ep.healthLive),
  healthReady: () => client.get(ep.healthReady),
  chatProviders: () => client.get(ep.chatProviders),
  ttsProviders: () => client.get(ep.ttsProviders),
  ttsVoices: (providerId) =>
    client.get(`${ep.ttsVoices}?provider_id=${encodeURIComponent(providerId)}`, {
      tags: { name: ep.ttsVoices },
    }),
  demoChat: (text) => client.post(ep.demoChat, { text }),
};
