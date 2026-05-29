// TypeScript mirror of the C# NodeDefinition / INodeProvider contracts.
// Keep in sync with Inktide.API.Graph.Domain.

export type PortDataType = 'text' | 'audio' | 'context' | 'platform'

export interface PortDef {
  name: string
  dataType: PortDataType
  description?: string
}

export type ConfigFieldType = 'string' | 'number' | 'select' | 'bool'

export interface ConfigFieldSchema {
  fieldType: ConfigFieldType
  default?: unknown
  description?: string
  options?: string[]
}

export type NodeCategory = 'core' | 'model' | 'processor' | 'plugin'

export interface NodeDefinition {
  type: PipelineNodeType
  providerId: string
  label: string
  description: string
  inputs: PortDef[]
  outputs: PortDef[]
  configSchema: Record<string, ConfigFieldSchema>
  accent: string      // visual accent color — UI only, not in C# model
  category: NodeCategory
}

export type PipelineNodeType =
  | 'input' | 'context_builder' | 'llm' | 'tts' | 'output'
  | 'discord' | 'twitch' | 'telegram'
  | 'emotion' | 'memory' | 'filter'

// ── Built-in definitions ──────────────────────────────────────────────────────

export const NODE_DEFINITIONS: Record<PipelineNodeType, NodeDefinition> = {
  input: {
    type: 'input',
    providerId: 'core',
    label: 'Input',
    description: 'Normalises messages from platform connectors into a context envelope.',
    inputs:  [{ name: 'platform', dataType: 'platform', description: 'Platform connector (Discord, Twitch, Telegram)' }],
    outputs: [{ name: 'out',      dataType: 'context',  description: 'Normalised message context' }],
    configSchema: {
      channel_filter:     { fieldType: 'string', default: 'all',  description: 'Channel name or "all"' },
      language:           { fieldType: 'string', default: 'any',  description: 'Language filter or "any"' },
      max_message_length: { fieldType: 'number', default: 2000,   description: 'Drop messages longer than this' },
    },
    accent: '#EAB308',
    category: 'core',
  },

  context_builder: {
    type: 'context_builder',
    providerId: 'core',
    label: 'Context',
    description: 'Aggregates Input context + plugin enrichments into a prompt-ready envelope for the LLM.',
    inputs: [
      { name: 'context',  dataType: 'context', description: 'Message context from Input (required)' },
      { name: 'memories', dataType: 'context', description: 'Memory enrichments from Memory node (optional)' },
      { name: 'emotion',  dataType: 'text',    description: 'Emotion signal from Emotion node (optional)' },
    ],
    outputs: [
      { name: 'out', dataType: 'context', description: 'Enriched context ready for LLM' },
    ],
    configSchema: {},
    accent: '#8B5CF6',
    category: 'core',
  },

  llm: {
    type: 'llm',
    providerId: 'core',
    label: 'LLM',
    description: 'Generates a text response via a language model.',
    inputs:  [{ name: 'context',  dataType: 'context', description: 'Enriched context envelope' }],
    outputs: [{ name: 'response', dataType: 'text',    description: 'Generated text response' }],
    configSchema: {
      provider_id:            { fieldType: 'select', default: 'ollama', options: ['ollama', 'openai', 'custom'] },
      model_id:               { fieldType: 'string', default: '' },
      temperature:            { fieldType: 'number', default: 0.7 },
      max_tokens:             { fieldType: 'number', default: 512 },
      system_prompt_override: { fieldType: 'string', default: '' },
    },
    accent: '#6366F1',
    category: 'model',
  },

  tts: {
    type: 'tts',
    providerId: 'core',
    label: 'TTS',
    description: 'Synthesises speech audio from the LLM text response.',
    inputs:  [{ name: 'text',  dataType: 'text',  description: 'Text to synthesise' }],
    outputs: [{ name: 'audio', dataType: 'audio', description: 'PCM audio stream' }],
    configSchema: {
      provider_id: { fieldType: 'select', default: 'kokoro', options: ['kokoro', 'elevenlabs'] },
      voice_id:    { fieldType: 'string', default: '' },
      speed:       { fieldType: 'number', default: 1.0 },
      stability:   { fieldType: 'number', default: 0.75 },
    },
    accent: '#10B981',
    category: 'processor',
  },

  output: {
    type: 'output',
    providerId: 'core',
    label: 'Output',
    description: 'Delivers audio to the target platform channel.',
    inputs:  [{ name: 'audio', dataType: 'audio', description: 'Rendered audio to deliver' }],
    outputs: [],
    configSchema: {
      channel_target: { fieldType: 'select', default: 'discord', options: ['discord', 'twitch', 'browser'] },
      fallback_text:  { fieldType: 'bool',   default: true },
    },
    accent: '#F97316',
    category: 'core',
  },

  discord: {
    type: 'input',
    providerId: 'discord',
    label: 'Discord',
    description: 'Receives messages from a Discord guild channel.',
    inputs: [],
    outputs: [{ name: 'out', dataType: 'platform', description: 'Discord message → Input' }],
    configSchema: {
      guild_id:   { fieldType: 'string', default: '', description: 'Discord Guild (Server) ID' },
      channel_id: { fieldType: 'string', default: '', description: 'Discord Channel ID to listen on' },
      language:   { fieldType: 'string', default: 'any', description: 'Language filter or "any"' },
    },
    accent: '#5865F2',
    category: 'core',
  },

  twitch: {
    type: 'input',
    providerId: 'twitch',
    label: 'Twitch',
    description: 'Receives messages from a Twitch channel chat.',
    inputs: [],
    outputs: [{ name: 'out', dataType: 'platform', description: 'Twitch chat message → Input' }],
    configSchema: {
      channel_name: { fieldType: 'string', default: '', description: 'Twitch channel name (without #)' },
      bits_only:    { fieldType: 'bool',   default: false, description: 'Process only bit cheer messages' },
      subs_only:    { fieldType: 'bool',   default: false, description: 'Process only subscriber messages' },
    },
    accent: 'var(--platform-twitch)',
    category: 'core',
  },

  telegram: {
    type: 'input',
    providerId: 'telegram',
    label: 'Telegram',
    description: 'Receives messages from a Telegram bot chat or group.',
    inputs: [],
    outputs: [{ name: 'out', dataType: 'platform', description: 'Telegram message → Input' }],
    configSchema: {
      chat_id:       { fieldType: 'string', default: '', description: 'Telegram Chat ID' },
      commands_only: { fieldType: 'bool',   default: false, description: 'Process only /command messages' },
    },
    accent: '#2CA5E0',
    category: 'core',
  },

  emotion: {
    type: 'emotion',
    providerId: 'plugin',
    label: 'Emotion',
    description: 'Classifies the emotional tone of the incoming message. Connect output to Context node.',
    inputs:  [],   // root node — receives message text automatically via initialInput
    outputs: [{ name: 'emotion', dataType: 'text', description: 'Emotion label → Context' }],
    configSchema: {
      threshold: { fieldType: 'number', default: 0.5, description: 'Confidence threshold' },
    },
    accent: '#EC4899',
    category: 'plugin',
  },

  memory: {
    type: 'memory',
    providerId: 'plugin',
    label: 'Memory',
    description: 'Retrieves semantically relevant memories from the vector store. Connect output to Context node.',
    inputs:  [],   // root node — receives message text automatically via initialInput
    outputs: [{ name: 'memories', dataType: 'context', description: 'Retrieved memory chunks → Context' }],
    configSchema: {
      top_k:      { fieldType: 'number', default: 5,               description: 'Max results' },
      collection: { fieldType: 'string', default: 'chat_memories', description: 'Qdrant collection' },
    },
    accent: '#EC4899',
    category: 'plugin',
  },

  filter: {
    type: 'filter',
    providerId: 'plugin',
    label: 'Filter',
    description: 'Guards LLM output against policy violations.',
    inputs:  [{ name: 'text', dataType: 'text', description: 'LLM response to filter' }],
    outputs: [{ name: 'text', dataType: 'text', description: 'Filtered text' }],
    configSchema: {
      mode: { fieldType: 'select', default: 'block', options: ['block', 'warn', 'rewrite'] },
    },
    accent: '#EC4899',
    category: 'plugin',
  },
}

// Data-type colours for port handles and edges
export const DATA_TYPE_COLOR: Record<PortDataType, string> = {
  platform: '#F59E0B',  // amber   — platform connectors → Input
  context:  '#8B5CF6',  // purple  — Input/Memory/Context out
  text:     '#6366F1',  // indigo  — LLM/Emotion/Filter
  audio:    '#10B981',  // emerald — TTS → Output
}
