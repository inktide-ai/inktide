export const ELEVENLABS_MODELS = [
  { id: 'eleven_multilingual_v2', label: 'Multilingual v2 (recommended)' },
  { id: 'eleven_turbo_v2_5',      label: 'Turbo v2.5 (low-latency)' },
  { id: 'eleven_flash_v2_5',      label: 'Flash v2.5 (fastest)' },
  { id: 'eleven_turbo_v2',        label: 'Turbo v2' },
  { id: 'eleven_monolingual_v1',  label: 'Monolingual v1 (EN only)' },
  { id: 'eleven_multilingual_v1', label: 'Multilingual v1' },
]

export const OPENAI_VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse',
] as const

export const OPENAI_MODELS = [
  { id: 'tts-1',           label: 'TTS-1 (standard, low-latency)' },
  { id: 'tts-1-hd',        label: 'TTS-1 HD (higher quality)' },
  { id: 'gpt-4o-mini-tts', label: 'GPT-4o Mini TTS' },
]

export const FISHAUDIO_MODELS = [
  { id: 's2-pro', label: 'S2 Pro (recommended)' },
  { id: 's1',     label: 'S1 (standard)' },
]

export const CARTESIA_MODELS = [
  { id: 'sonic-2',     label: 'Sonic 2 (latest, recommended)' },
  { id: 'sonic-turbo', label: 'Sonic Turbo (lowest latency)' },
]
