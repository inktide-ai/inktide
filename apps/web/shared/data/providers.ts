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
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '◈',
    description: 'Google Gemini models via Generative Language API.',
    requiresKey: true,
    fixedBaseUrl: 'https://generativelanguage.googleapis.com',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('AIza')) return 'Google API keys start with AIza'
      return null
    },
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '▲',
    description: 'Mistral Large and open-weight models.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.mistral.ai/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    description: 'LPU-accelerated inference — Llama, Mixtral and more.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.groq.com/openai/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('gsk_')) return 'Groq keys start with gsk_'
      return null
    },
  },
  {
    id: 'cohere',
    name: 'Cohere',
    icon: '◉',
    description: 'Command R+ and enterprise RAG models.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.cohere.com/v2',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
  },
  {
    id: 'xai',
    name: 'xAI / Grok',
    icon: '✕',
    description: 'Grok models with real-time web access.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.x.ai/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('xai-')) return 'xAI keys start with xai-'
      return null
    },
  },
  {
    id: 'together',
    name: 'Together AI',
    icon: '◆',
    description: 'Hundreds of open-source models on serverless GPUs.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.together.xyz/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    icon: '◎',
    description: 'Search-augmented Sonar models with live citations.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.perplexity.ai',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('pplx-')) return 'Perplexity keys start with pplx-'
      return null
    },
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    icon: '☁',
    description: 'OpenAI models on Microsoft Azure — enterprise SLAs and compliance.',
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
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    icon: '◧',
    description: 'Local LLM via LM Studio\'s built-in OpenAI-compatible server.',
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
    autoValidate: ({ baseUrl }) => {
      const url = baseUrl.trim()
      if (!url) return 'Server URL is required.'
      if (!isValidUrl(url)) return 'Enter a valid URL (http:// or https://).'
      return null
    },
  },
  {
    id: 'openai-compat',
    name: 'OpenAI-compatible',
    icon: '⊕',
    description: 'Any OpenAI-compatible endpoint — vLLM, LocalAI, Llama.cpp server and more.',
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
    autoValidate: ({ baseUrl }) => {
      const url = baseUrl.trim()
      if (!url) return 'Server URL is required.'
      if (!isValidUrl(url)) return 'Enter a valid URL (http:// or https://).'
      return null
    },
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '⇄',
    description: 'Single API key for hundreds of models from every major provider.',
    requiresKey: true,
    fixedBaseUrl: 'https://openrouter.ai/api/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('sk-or-')) return 'OpenRouter keys start with sk-or-'
      return null
    },
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    icon: '✦',
    description: 'Fast open-source model inference.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.fireworks.ai/inference/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('fw_')) return 'Fireworks keys start with fw_'
      return null
    },
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    icon: '⚡',
    description: 'Ultra-fast wafer-scale LPU inference.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.cerebras.ai/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('csk-')) return 'Cerebras keys start with csk-'
      return null
    },
  },
  {
    id: 'replicate',
    name: 'Replicate',
    icon: '◈',
    description: 'Serverless inference — pay per prediction.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.replicate.com/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (!k.startsWith('r8_')) return 'Replicate tokens start with r8_'
      return null
    },
  },
  {
    id: 'bedrock',
    name: 'Amazon Bedrock',
    icon: '☁',
    description: 'AWS managed foundation models.',
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
  },
  {
    id: 'vertex',
    name: 'Google Vertex AI',
    icon: '◈',
    description: 'Google Cloud enterprise AI with Gemini and open models.',
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
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare AI',
    icon: '☁',
    description: 'Edge AI inference via Cloudflare Workers.',
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
  },
  {
    id: 'novita',
    name: 'NovitaAI',
    icon: '◉',
    description: 'Affordable serverless open-source model inference.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.novita.ai/v3/openai',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
  },
  {
    id: 'sambanova',
    name: 'SambaNova',
    icon: '⚡',
    description: 'Dataflow architecture for extreme inference throughput.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.sambanova.ai/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
  },
  {
    id: 'jan',
    name: 'Jan.ai',
    icon: '◧',
    description: 'Local LLM via Jan\'s built-in OpenAI-compatible server.',
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
    autoValidate: ({ baseUrl }) => {
      const url = baseUrl.trim()
      if (!url) return 'Server URL is required.'
      if (!isValidUrl(url)) return 'Enter a valid URL (http:// or https://).'
      return null
    },
  },
  {
    id: 'localai',
    name: 'LocalAI',
    icon: '◧',
    description: 'Free self-hosted OpenAI-compatible API for many model families.',
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
    autoValidate: ({ baseUrl }) => {
      const url = baseUrl.trim()
      if (!url) return 'Server URL is required.'
      if (!isValidUrl(url)) return 'Enter a valid URL (http:// or https://).'
      return null
    },
  },
  {
    id: 'vllm',
    name: 'vLLM',
    icon: '▶',
    description: 'High-throughput inference engine with PagedAttention.',
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
    autoValidate: ({ baseUrl }) => {
      const url = baseUrl.trim()
      if (!url) return 'Server URL is required.'
      if (!isValidUrl(url)) return 'Enter a valid URL (http:// or https://).'
      return null
    },
  },
  {
    id: 'llamacpp',
    name: 'Llama.cpp',
    icon: '◈',
    description: 'CPU/GPU inference via llama-server (llama.cpp HTTP server).',
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
    autoValidate: ({ baseUrl }) => {
      const url = baseUrl.trim()
      if (!url) return 'Server URL is required.'
      if (!isValidUrl(url)) return 'Enter a valid URL (http:// or https://).'
      return null
    },
  },
  {
    id: 'ai21',
    name: 'AI21 Labs',
    icon: '◆',
    description: 'State-Space hybrid Jamba models with 256k context.',
    requiresKey: true,
    fixedBaseUrl: 'https://api.ai21.com/studio/v1',
    autoValidate: ({ apiKey }) => {
      const k = apiKey.trim()
      if (!k) return 'API key is required.'
      if (k.length < 20) return 'API key looks too short.'
      return null
    },
  },
]
