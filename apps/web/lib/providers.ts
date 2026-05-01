export interface ProviderFieldOption {
  value: string
  label: string
}

export interface ProviderFieldDef {
  key: string
  label: string
  hint?: string
  type: 'text' | 'password' | 'select' | 'kv-pairs'
  placeholder?: string
  options?: ProviderFieldOption[]
  default?: unknown
}

export interface ProviderDefinition {
  id: string
  name: string
  icon: string
  description: string
  requiresKey: boolean
  /** Remote providers: fixed endpoint, user cannot change it */
  fixedBaseUrl?: string
  /** Local providers: editable default endpoint */
  defaultBaseUrl?: string
  /** Additional provider-specific fields stored in Config JSON blob */
  extraFields?: ProviderFieldDef[]
  /** Pure format check — no network call. Returns null if OK, error string if not. */
  autoValidate: (cfg: { apiKey: string; baseUrl: string }) => string | null
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export const PROVIDER_DEFS: ProviderDefinition[] = [
  {
    id: 'ollama',
    name: 'Ollama',
    icon: '🦙',
    description: 'Local LLM server — no API key required.',
    requiresKey: false,
    defaultBaseUrl: 'http://localhost:11434',
    extraFields: [
      {
        key: 'thinkingMode',
        label: 'Thinking Mode',
        hint: 'Controls extended thinking in supported models (e.g. qwq, deepseek-r1).',
        type: 'select',
        options: ['auto', 'disable', 'enable', 'low', 'medium', 'high'].map((v) => ({ value: v, label: v })),
        default: 'auto',
      },
      {
        key: 'headers',
        label: 'Custom Headers',
        hint: 'Extra HTTP headers sent with every request (e.g. for reverse-proxy auth).',
        type: 'kv-pairs',
      },
    ],
    autoValidate: ({ baseUrl }) => {
      const url = baseUrl.trim()
      if (!url) return 'Server URL is required.'
      if (!isValidUrl(url)) return 'Enter a valid URL (http:// or https://).'
      return null
    },
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '◆',
    description: 'Claude models via Anthropic API.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.anthropic.com',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('sk-ant-')) return 'Anthropic keys start with sk-ant-'
      return null
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '⚡',
    description: 'DeepSeek Chat & R1 reasoning models.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.deepseek.com',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('sk-')) return 'DeepSeek keys start with sk-'
      return null
    },
  },
]
