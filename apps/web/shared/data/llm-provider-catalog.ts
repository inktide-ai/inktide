/**
 * Single source of truth for all LLM providers.
 * Merges operational data (validation, credentials) with visual data (icons, tags).
 * Adding a new provider = one entry here, nowhere else.
 */

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

export interface LlmProviderDef {
  id: string
  name: string

  requiresKey: boolean
  /** Remote providers: user cannot change this URL */
  fixedBaseUrl?: string
  /** Local providers: editable default URL */
  defaultBaseUrl?: string
  extraFields?: ProviderFieldDef[]
  /** Pure format check — no network call. Returns null if OK, error string if not. */
  autoValidate: (cfg: { apiKey: string; baseUrl: string }) => string | null

  /** Path under `public/` e.g. `/images/providers/brain/foo.svg` */
  iconSrc: string
  /** Emoji fallback shown in dense list views (character editor grid) */
  icon: string
  description: string
  /** Representative flagship model name */
  model: string
  tags: string[]
  /** Filter type tags for the Type dropdown */
  types: string[]
  kind: string
  contextSize?: string
  recommended?: boolean
  badge?: string
  /** Icon is dark/black — render on white background on dark theme */
  darkIcon?: boolean
  websiteUrl?: string
  supportUrl?: string
}


function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function requiresLocalUrl(label: string) {
  return ({ baseUrl }: { apiKey: string; baseUrl: string }): string | null => {
    const url = baseUrl.trim()
    if (!url) return `${label} server URL is required.`
    if (!isValidUrl(url)) return 'Enter a valid URL (http:// or https://).'
    return null
  }
}


export const LLM_PROVIDER_CATALOG: LlmProviderDef[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    requiresKey: true,
    fixedBaseUrl: 'https://api.openai.com/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('sk-')) return 'OpenAI keys start with sk-'
      return null
    },
    iconSrc: '/images/providers/brain/chatgpt.svg',
    icon: '◆',
    description: 'GPT-4o and o-series models via OpenAI API.',
    model: 'GPT-4o',
    kind: 'API',
    badge: 'Team',
    contextSize: '128k context',
    tags: ['Reliable', 'Creative', 'Production'],
    recommended: true,
    types: ['api-key', 'recommended'],
    websiteUrl: 'https://platform.openai.com',
    supportUrl: 'https://help.openai.com',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    requiresKey: true,
    fixedBaseUrl: 'https://api.anthropic.com',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('sk-ant-')) return 'Anthropic keys start with sk-ant-'
      return null
    },
    iconSrc: '/images/providers/brain/anthropic.svg',
    icon: '◆',
    description: 'Constitutional AI model with strong reasoning and safety alignment.',
    model: 'Claude 3.5 Sonnet',
    kind: 'API',
    badge: 'Team',
    contextSize: '200k',
    tags: ['Balanced', 'Thoughtful', 'Long context'],
    recommended: true,
    types: ['api-key', 'recommended', 'enterprise'],
    websiteUrl: 'https://console.anthropic.com',
    supportUrl: 'https://support.anthropic.com',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    requiresKey: true,
    fixedBaseUrl: 'https://api.deepseek.com',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('sk-')) return 'DeepSeek keys start with sk-'
      return null
    },
    iconSrc: '/images/providers/brain/deepseek.svg',
    icon: '⚡',
    description: 'Reasoning-focused models with competitive coding and math.',
    model: 'DeepSeek-V3',
    kind: 'Research',
    contextSize: '128k',
    tags: ['Fast', 'Efficient', 'Cost-effective'],
    types: ['api-key', 'open-source', 'openai-v1'],
    websiteUrl: 'https://platform.deepseek.com',
    supportUrl: 'https://platform.deepseek.com',
  },
  {
    id: 'ollama',
    name: 'Ollama',
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
    autoValidate: requiresLocalUrl('Ollama'),
    iconSrc: '/images/providers/brain/ollama.svg',
    icon: '🦙',
    description: 'Run models locally on your machine — private and offline-capable.',
    model: 'Local',
    kind: 'Local',
    tags: ['Private', 'Offline', 'Customizable'],
    types: ['local', 'open-source', 'openai-v1'],
    websiteUrl: 'https://ollama.ai',
    supportUrl: 'https://github.com/ollama/ollama/issues',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    requiresKey: true,
    fixedBaseUrl: 'https://generativelanguage.googleapis.com',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('AIza')) return 'Google API keys start with AIza'
      return null
    },
    iconSrc: '/images/providers/brain/gemini.webp',
    icon: '◈',
    description: "Google's multimodal flagship with a 1M token context window.",
    model: 'Gemini 2.0 Flash',
    kind: 'API',
    contextSize: '1M',
    tags: ['Fast', 'Multimodal', 'Long context'],
    recommended: true,
    types: ['api-key', 'recommended'],
    websiteUrl: 'https://aistudio.google.com',
    supportUrl: 'https://ai.google.dev/gemini-api/docs',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    requiresKey: true,
    fixedBaseUrl: 'https://api.mistral.ai/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
    iconSrc: '/images/providers/brain/mistral.svg',
    icon: '▲',
    description: 'European frontier models with open-weight releases and strong reasoning.',
    model: 'Mistral Large',
    kind: 'API',
    contextSize: '128k',
    tags: ['Efficient', 'European', 'Open weights'],
    types: ['api-key', 'open-source'],
    websiteUrl: 'https://console.mistral.ai',
    supportUrl: 'https://help.mistral.ai',
  },
  {
    id: 'groq',
    name: 'Groq',
    requiresKey: true,
    fixedBaseUrl: 'https://api.groq.com/openai/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('gsk_')) return 'Groq keys start with gsk_'
      return null
    },
    iconSrc: '/images/providers/brain/groq.svg',
    icon: '⚡',
    description: 'LPU inference engine delivering best-in-class token throughput.',
    model: 'Llama 3.3 70B',
    kind: 'API',
    badge: 'Fast',
    tags: ['Fast', 'Open source', 'Low latency'],
    darkIcon: true,
    types: ['api-key', 'open-source', 'openai-v1'],
    websiteUrl: 'https://console.groq.com',
    supportUrl: 'https://groq.com/contact',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    requiresKey: true,
    fixedBaseUrl: 'https://api.cohere.com/v2',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
    iconSrc: '/images/providers/brain/cohere.svg',
    icon: '◉',
    description: 'Enterprise-grade models optimised for RAG and structured generation.',
    model: 'Command R+',
    kind: 'API',
    contextSize: '128k',
    tags: ['RAG', 'Structured', 'Enterprise'],
    types: ['api-key', 'enterprise'],
    websiteUrl: 'https://dashboard.cohere.com',
    supportUrl: 'https://docs.cohere.com',
  },
  {
    id: 'xai',
    name: 'xAI / Grok',
    requiresKey: true,
    fixedBaseUrl: 'https://api.x.ai/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('xai-')) return 'xAI keys start with xai-'
      return null
    },
    iconSrc: '/images/providers/brain/xai.svg',
    icon: '✕',
    description: 'Grok models with real-time data access and strong reasoning capabilities.',
    model: 'Grok 2',
    kind: 'API',
    contextSize: '131k',
    tags: ['Real-time data', 'Witty', 'Reasoning'],
    darkIcon: true,
    types: ['api-key'],
    websiteUrl: 'https://console.x.ai',
    supportUrl: 'https://docs.x.ai',
  },
  {
    id: 'together',
    name: 'Together AI',
    requiresKey: true,
    fixedBaseUrl: 'https://api.together.xyz/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
    iconSrc: '/images/providers/brain/together.svg',
    icon: '◆',
    description: 'Run hundreds of open-source models on serverless GPU infrastructure.',
    model: 'Llama 3.1 405B',
    kind: 'API',
    tags: ['Open models', 'Scalable', 'BYOM'],
    types: ['api-key', 'open-source', 'openai-v1'],
    websiteUrl: 'https://api.together.ai',
    supportUrl: 'https://docs.together.ai',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    requiresKey: true,
    fixedBaseUrl: 'https://api.perplexity.ai',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('pplx-')) return 'Perplexity keys start with pplx-'
      return null
    },
    iconSrc: '/images/providers/brain/perplexity.svg',
    icon: '◎',
    description: 'Search-augmented models that cite live web sources in every response.',
    model: 'Sonar Pro',
    kind: 'API',
    tags: ['Web search', 'Citations', 'Real-time'],
    types: ['api-key', 'openai-v1'],
    websiteUrl: 'https://www.perplexity.ai/settings/api',
    supportUrl: 'https://docs.perplexity.ai',
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    requiresKey: true,
    defaultBaseUrl: 'https://<resource>.openai.azure.com',
    extraFields: [
      {
        key: 'deployment',
        label: 'Deployment name',
        hint: 'The deployment name you set when you created the model in Azure.',
        type: 'text',
        placeholder: 'my-gpt4o-deployment',
      },
      {
        key: 'apiVersion',
        label: 'API version',
        hint: 'Azure OpenAI API version to use.',
        type: 'select',
        options: [
          { value: '2025-01-01-preview', label: '2025-01-01-preview' },
          { value: '2024-10-21', label: '2024-10-21' },
          { value: '2024-08-01-preview', label: '2024-08-01-preview' },
        ],
        default: '2025-01-01-preview',
      },
    ],
    autoValidate: ({ apiKey, baseUrl }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      if (!isValidUrl(baseUrl.trim())) return 'Enter your Azure resource endpoint URL.'
      return null
    },
    iconSrc: '/images/providers/brain/azure-openai.svg',
    icon: '☁',
    description: 'OpenAI models hosted on Microsoft Azure with enterprise SLAs and compliance.',
    model: 'GPT-4o (Azure)',
    kind: 'API',
    badge: 'Enterprise',
    tags: ['Enterprise', 'Compliance', 'SLA'],
    types: ['api-key', 'enterprise', 'openai-v1'],
    websiteUrl: 'https://oai.azure.com',
    supportUrl: 'https://learn.microsoft.com/azure/ai-services/openai',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    requiresKey: false,
    defaultBaseUrl: 'http://localhost:1234',
    extraFields: [
      {
        key: 'headers',
        label: 'Custom Headers',
        hint: 'Extra HTTP headers sent with every request.',
        type: 'kv-pairs',
      },
    ],
    autoValidate: requiresLocalUrl('LM Studio'),
    iconSrc: '/images/providers/brain/lmstudio.svg',
    icon: '◧',
    description: "Desktop app for running local models with an OpenAI-compatible API.",
    model: 'Local',
    kind: 'Local',
    tags: ['Private', 'GUI', 'OpenAI-compatible'],
    darkIcon: true,
    types: ['local', 'open-source', 'openai-v1'],
    websiteUrl: 'https://lmstudio.ai',
    supportUrl: 'https://lmstudio.ai/docs',
  },
  {
    id: 'openai-compat',
    name: 'OpenAI-compatible',
    requiresKey: false,
    defaultBaseUrl: '',
    extraFields: [
      {
        key: 'headers',
        label: 'Custom Headers',
        hint: 'Extra HTTP headers sent with every request (e.g. for auth tokens).',
        type: 'kv-pairs',
      },
    ],
    autoValidate: requiresLocalUrl('OpenAI-compatible'),
    iconSrc: '/images/providers/brain/chatgpt.svg',
    icon: '⊕',
    description: 'Connect any OpenAI-compatible API endpoint — vLLM, LocalAI, Llama.cpp and more.',
    model: 'Custom',
    kind: 'Custom',
    tags: ['Self-hosted', 'Flexible', 'Any model'],
    types: ['local', 'openai-v1'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    requiresKey: true,
    fixedBaseUrl: 'https://openrouter.ai/api/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('sk-or-')) return 'OpenRouter keys start with sk-or-'
      return null
    },
    iconSrc: '/images/providers/brain/openrouter.svg',
    icon: '⇄',
    description: 'Single API key to access hundreds of models from every major provider.',
    model: 'All Models',
    kind: 'API',
    tags: ['Multi-provider', 'Routing', 'Cost optimization'],
    darkIcon: true,
    types: ['api-key', 'openai-v1'],
    websiteUrl: 'https://openrouter.ai',
    supportUrl: 'https://openrouter.ai/docs',
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    requiresKey: true,
    fixedBaseUrl: 'https://api.fireworks.ai/inference/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('fw_')) return 'Fireworks keys start with fw_'
      return null
    },
    iconSrc: '/images/providers/brain/fireworks.svg',
    icon: '✦',
    description: 'High-throughput inference for open-source models at low cost.',
    model: 'Llama 3.3 70B',
    kind: 'API',
    tags: ['Fast', 'Open source', 'Low cost'],
    types: ['api-key', 'openai-v1', 'open-source'],
    websiteUrl: 'https://fireworks.ai',
    supportUrl: 'https://docs.fireworks.ai',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    requiresKey: true,
    fixedBaseUrl: 'https://api.cerebras.ai/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('csk-')) return 'Cerebras keys start with csk-'
      return null
    },
    iconSrc: '/images/providers/brain/cerebras.svg',
    icon: '⚡',
    description: 'Wafer-scale LPU delivering the fastest inference speeds available.',
    model: 'Llama 4 Scout',
    kind: 'API',
    badge: 'Fast',
    tags: ['Ultra-fast', 'Open source', 'Low latency'],
    darkIcon: true,
    types: ['api-key', 'openai-v1', 'open-source'],
    websiteUrl: 'https://inference.cerebras.ai',
    supportUrl: 'https://docs.cerebras.ai',
  },
  {
    id: 'replicate',
    name: 'Replicate',
    requiresKey: true,
    fixedBaseUrl: 'https://api.replicate.com/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('r8_')) return 'Replicate tokens start with r8_'
      return null
    },
    iconSrc: '/images/providers/brain/replicate.svg',
    icon: '◈',
    description: 'Run open-source models in the cloud — pay only per prediction.',
    model: 'Various',
    kind: 'API',
    tags: ['Open source', 'Serverless', 'Pay-per-run'],
    darkIcon: true,
    types: ['api-key', 'open-source'],
  },
  {
    id: 'bedrock',
    name: 'Amazon Bedrock',
    requiresKey: true,
    defaultBaseUrl: '',
    extraFields: [
      {
        key: 'region',
        label: 'AWS Region',
        hint: 'AWS region where your Bedrock endpoint is deployed.',
        type: 'select',
        options: [
          { value: 'us-east-1', label: 'us-east-1' },
          { value: 'us-west-2', label: 'us-west-2' },
          { value: 'eu-west-1', label: 'eu-west-1' },
          { value: 'ap-northeast-1', label: 'ap-northeast-1' },
        ],
        default: 'us-east-1',
      },
      {
        key: 'accessKeyId',
        label: 'AWS Access Key ID',
        hint: 'Your AWS IAM access key ID.',
        type: 'text',
        placeholder: 'AKIAIOSFODNN7EXAMPLE',
      },
      {
        key: 'secretAccessKey',
        label: 'AWS Secret Access Key',
        hint: 'Your AWS IAM secret access key.',
        type: 'password',
        placeholder: '••••••••',
      },
    ],
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'AWS Access Key ID is required.'
      return null
    },
    iconSrc: '/images/providers/brain/bedrock.svg',
    icon: '☁',
    description: 'Fully managed AWS service with access to top foundation models.',
    model: 'Claude / Llama / Titan',
    kind: 'API',
    badge: 'Enterprise',
    tags: ['AWS', 'Enterprise', 'Managed'],
    types: ['api-key', 'enterprise'],
  },
  {
    id: 'vertex',
    name: 'Google Vertex AI',
    requiresKey: true,
    defaultBaseUrl: '',
    extraFields: [
      {
        key: 'projectId',
        label: 'GCP Project ID',
        hint: 'Your Google Cloud project ID.',
        type: 'text',
        placeholder: 'my-gcp-project',
      },
      {
        key: 'location',
        label: 'Location',
        hint: 'GCP region for Vertex AI (e.g. us-central1).',
        type: 'text',
        placeholder: 'us-central1',
        default: 'us-central1',
      },
    ],
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key or service account token is required.'
      return null
    },
    iconSrc: '/images/providers/brain/vertex.svg',
    icon: '◈',
    description: 'Google Cloud enterprise AI platform with Gemini and open models.',
    model: 'Gemini (GCP)',
    kind: 'API',
    badge: 'Enterprise',
    tags: ['GCP', 'Enterprise', 'Managed'],
    types: ['api-key', 'enterprise'],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare AI',
    requiresKey: true,
    fixedBaseUrl: 'https://api.cloudflare.com/client/v4',
    extraFields: [
      {
        key: 'accountId',
        label: 'Account ID',
        hint: 'Your Cloudflare account ID (found in the dashboard).',
        type: 'text',
        placeholder: 'a1b2c3d4e5f6...',
      },
    ],
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API token is required.'
      if (k.length < 20) return 'API token looks too short.'
      return null
    },
    iconSrc: '/images/providers/brain/cloudflare.svg',
    icon: '☁',
    description: 'Run AI models at the edge via Cloudflare Workers AI.',
    model: 'Llama (Edge)',
    kind: 'API',
    tags: ['Edge', 'Fast', 'Serverless'],
    types: ['api-key', 'openai-v1'],
  },
  {
    id: 'novita',
    name: 'NovitaAI',
    requiresKey: true,
    fixedBaseUrl: 'https://api.novita.ai/v3/openai',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
    iconSrc: '/images/providers/brain/novita.svg',
    icon: '◉',
    description: 'Affordable serverless inference for popular open-source models.',
    model: 'Various',
    kind: 'API',
    tags: ['Affordable', 'Open source', 'Fast'],
    types: ['api-key', 'openai-v1', 'open-source'],
  },
  {
    id: 'sambanova',
    name: 'SambaNova',
    requiresKey: true,
    fixedBaseUrl: 'https://api.sambanova.ai/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
    iconSrc: '/images/providers/brain/sambanova.svg',
    icon: '⚡',
    description: 'Dataflow architecture delivering extreme inference throughput.',
    model: 'Llama 4 Maverick',
    kind: 'API',
    badge: 'Fast',
    tags: ['Ultra-fast', 'Enterprise', 'Open source'],
    types: ['api-key', 'openai-v1', 'open-source'],
  },
  {
    id: 'jan',
    name: 'Jan.ai',
    requiresKey: false,
    defaultBaseUrl: 'http://localhost:1337',
    extraFields: [
      {
        key: 'headers',
        label: 'Custom Headers',
        hint: 'Extra HTTP headers sent with every request.',
        type: 'kv-pairs',
      },
    ],
    autoValidate: requiresLocalUrl('Jan.ai'),
    iconSrc: '/images/providers/brain/jan.svg',
    icon: '◧',
    description: "Open-source desktop app for running local models, port 1337.",
    model: 'Local',
    kind: 'Local',
    tags: ['Private', 'GUI', 'OpenAI-compatible'],
    types: ['local', 'openai-v1', 'open-source'],
  },
  {
    id: 'localai',
    name: 'LocalAI',
    requiresKey: false,
    defaultBaseUrl: 'http://localhost:8080',
    extraFields: [
      {
        key: 'headers',
        label: 'Custom Headers',
        hint: 'Extra HTTP headers sent with every request.',
        type: 'kv-pairs',
      },
    ],
    autoValidate: requiresLocalUrl('LocalAI'),
    iconSrc: '/images/providers/brain/localai.svg',
    icon: '◧',
    description: 'Free, self-hosted OpenAI-compatible API server for many model families.',
    model: 'Local',
    kind: 'Local',
    tags: ['Private', 'Self-hosted', 'Many models'],
    types: ['local', 'openai-v1', 'open-source'],
  },
  {
    id: 'vllm',
    name: 'vLLM',
    requiresKey: false,
    defaultBaseUrl: 'http://localhost:8000',
    extraFields: [
      {
        key: 'headers',
        label: 'Custom Headers',
        hint: 'Extra HTTP headers sent with every request.',
        type: 'kv-pairs',
      },
    ],
    autoValidate: requiresLocalUrl('vLLM'),
    iconSrc: '/images/providers/brain/vllm.svg',
    icon: '▶',
    description: 'High-throughput inference engine with PagedAttention for batched requests.',
    model: 'Self-hosted',
    kind: 'Local',
    tags: ['High-throughput', 'Self-hosted', 'Research'],
    types: ['local', 'openai-v1', 'open-source'],
  },
  {
    id: 'llamacpp',
    name: 'Llama.cpp',
    requiresKey: false,
    defaultBaseUrl: 'http://localhost:8080',
    extraFields: [
      {
        key: 'headers',
        label: 'Custom Headers',
        hint: 'Extra HTTP headers sent with every request.',
        type: 'kv-pairs',
      },
    ],
    autoValidate: requiresLocalUrl('Llama.cpp'),
    iconSrc: '/images/providers/brain/llamacpp.svg',
    icon: '◈',
    description: 'Efficient CPU/GPU inference of quantized models via llama-server.',
    model: 'Quantized',
    kind: 'Local',
    tags: ['CPU inference', 'Private', 'Quantized'],
    types: ['local', 'openai-v1', 'open-source'],
  },
  {
    id: 'ai21',
    name: 'AI21 Labs',
    requiresKey: true,
    fixedBaseUrl: 'https://api.ai21.com/studio/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
    iconSrc: '/images/providers/brain/ai21.svg',
    icon: '◆',
    description: 'State-Space hybrid models with 256k context and strong efficiency.',
    model: 'Jamba 1.5',
    kind: 'API',
    contextSize: '256k',
    tags: ['Long context', 'Efficient', 'SSM'],
    types: ['api-key'],
  },
]

/** Look up a provider by id. Type-safe — returns undefined if not found. */
export function findProvider(id: string): LlmProviderDef | undefined {
  return LLM_PROVIDER_CATALOG.find((p) => p.id === id)
}
