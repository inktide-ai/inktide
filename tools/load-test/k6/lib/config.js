// Init-context configuration assembly.
// Merge order (lowest → highest precedence):
//   1. config/default.json      — environment-independent constants
//   2. config/profiles/<P>.json — load shape + thresholds for the selected profile
//   3. __ENV overrides          — passed by scripts/run.sh as -e flags
//
// Layering rule: lib/ imports nothing project-local. Everything downstream
// (clients/, scenarios/, main.js) reads CONFIG from here and only here.

const DEFAULTS = JSON.parse(open('../../config/default.json'));
const PROFILE_NAME = __ENV.PROFILE || 'smoke';
const PROFILE = JSON.parse(open(`../../config/profiles/${PROFILE_NAME}.json`));

function deriveWsUrl(httpUrl) {
  return httpUrl.replace(/^http/, 'ws');
}

const baseUrl = (__ENV.BASE_URL || DEFAULTS.baseUrl).replace(/\/$/, '');

export const CONFIG = {
  profileName: PROFILE_NAME,
  profileDescription: PROFILE.description || '',
  runId: __ENV.RUN_ID || 'adhoc',
  gitSha: __ENV.GIT_SHA || '',

  baseUrl,
  wsUrl: __ENV.WS_URL || deriveWsUrl(baseUrl),

  keycloak: {
    url: (__ENV.KC_URL || DEFAULTS.keycloak.url).replace(/\/$/, ''),
    realm: __ENV.KC_REALM || DEFAULTS.keycloak.realm,
    clientId: __ENV.KC_CLIENT_ID || DEFAULTS.keycloak.clientId,
  },
  benchUserPassword: __ENV.BENCH_USER_PASSWORD || '',

  endpoints: DEFAULTS.endpoints,
  hubEvents: DEFAULTS.hubEvents,
  slo: DEFAULTS.slo,
  rateBudgets: DEFAULTS.rateBudgets,
  scenarioMeta: DEFAULTS.scenarioMeta,

  tts: {
    providerId: __ENV.TTS_PROVIDER_ID || DEFAULTS.tts.providerId,
    voiceId: __ENV.TTS_VOICE_ID || DEFAULTS.tts.voiceId,
    format: DEFAULTS.tts.format,
    text: DEFAULTS.tts.text,
  },
  // When set, GET /tts/voices?provider_id=<value> joins the public mix.
  // Off by default: the endpoint proxies live to the provider and 502s when
  // the workers profile is down.
  ttsVoicesProvider: __ENV.TTS_VOICES_PROVIDER || '',
  // POST /demo/chat needs a reachable LLM (Ollama); opt-in.
  demoLlm: __ENV.DEMO_LLM === '1',

  chatInjector: __ENV.CHAT_INJECTOR || 'http',
  chatCardId: __ENV.CHAT_CARD_ID || '',
  redisUrl: __ENV.REDIS_URL || 'redis://localhost:6379',
  chat: Object.assign({}, DEFAULTS.chat, PROFILE.chat),

  userPoolSize: Number(__ENV.USER_POOL_SIZE || (PROFILE.userPool && PROFILE.userPool.size) || 0),

  scenarios: PROFILE.scenarios || {},
  thresholds: PROFILE.thresholds || {},
};

// Translate profile scenario entries into k6 options.scenarios.
// Every enabled entry is passed through verbatim (k6-native executor fields),
// minus our `enabled` marker, plus `exec` = scenario name — which must match
// a named export of main.js.
export function buildScenarios(config) {
  const out = {};
  for (const [name, sc] of Object.entries(config.scenarios)) {
    if (!sc || !sc.enabled) continue;
    const k6Fields = Object.assign({}, sc);
    delete k6Fields.enabled;
    out[name] = Object.assign(k6Fields, { exec: name });
  }
  return out;
}
