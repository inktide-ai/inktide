export const queryKeys = {
  souls: {
    all: ['souls'] as const,
    detail: (id: string) => ['souls', id] as const,
    models: (id: string) => ['souls', id, 'models'] as const,
    scenes: (id: string) => ['souls', id, 'scenes'] as const,
    runPresets: (id: string) => ['souls', id, 'run-presets'] as const,
    activity: (id: string) => ['souls', id, 'activity'] as const,
    publicActivity: (slug: string) => ['souls', 'public', slug, 'activity'] as const,
    channels: (id: string) => ['souls', id, 'channels'] as const,
  },
  catalog: {
    llmModels: ['catalog', 'llm-models'] as const,
    ttsVoices: ['catalog', 'tts-voices'] as const,
  },
  credentials: ['credentials'] as const,
  projects: {
    all: (soulId?: string) => ['projects', { soulId }] as const,
    detail: (id: string) => ['projects', id] as const,
    plugins: (id: string) => ['projects', id, 'plugins'] as const,
  },
  billing: {
    subscription: ['billing', 'subscription'] as const,
  },
  me: {
    profile: ['me'] as const,
    avatar: (userId: string) => ['me', 'avatar', userId] as const,
    storage: ['me', 'storage'] as const,
    preferences: {
      global: ['me', 'preferences', 'global'] as const,
      workspace: (characterId: string) => ['me', 'preferences', 'workspace', characterId] as const,
    },
  },
  marketplace: {
    connectors: ['marketplace', 'connectors'] as const,
    installations: (soulId: string) => ['marketplace', 'souls', soulId, 'installs'] as const,
  },
  graph: {
    detail: (projectId: string) => ['graph', projectId] as const,
    nodeCatalog: ['graph', 'nodes'] as const,
  },
  chat: {
    providers: ['chat', 'providers'] as const,
    models: (providerId: string) => ['chat', 'models', providerId] as const,
  },
  tts: {
    providers: ['tts', 'providers'] as const,
    voices: (providerId: string) => ['tts', 'voices', providerId] as const,
  },
  organization: {
    invites: ['organization', 'invites'] as const,
  },
  stats: {
    dashboard: ['stats', 'dashboard'] as const,
  },
  developer: {
    apps: () => ['developer', 'apps'] as const,
    app: (id: string) => ['developer', 'apps', id] as const,
    deliveries: (appId: string) => ['developer', 'apps', appId, 'deliveries'] as const,
  },
}
