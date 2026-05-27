import type { CSSProperties, ReactNode } from 'react'

export function fmtProvider(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function getBrainLogo(providerId: string | null): ReactNode {
  const s: CSSProperties = { width: 40, height: 40, objectFit: 'contain', borderRadius: 10 }
  switch ((providerId ?? '').toLowerCase()) {
    case 'anthropic':
    case 'claude': return <img src="/images/providers/brain/anthropic.svg" style={s} alt="" aria-hidden />
    case 'openai': return <img src="/images/providers/brain/chatgpt.svg" style={s} alt="" aria-hidden />
    default: return <img src="/images/providers/brain/ollama.svg" style={s} alt="" aria-hidden />
  }
}

export function getVoiceLogo(providerId: string | null): ReactNode {
  const s: CSSProperties = { width: 40, height: 40, objectFit: 'contain', borderRadius: 10 }
  switch ((providerId ?? '').toLowerCase()) {
    case 'elevenlabs': return <img src="/images/providers/voice/elevenlabs-identity.svg" style={s} alt="" aria-hidden />
    case 'kokoro': return <img src="/images/providers/voice/kokoro.svg" style={s} alt="" aria-hidden />
    default: return <img src="/images/providers/voice/kokoro.svg" style={s} alt="" aria-hidden />
  }
}

export function formatLlmProvider(providerId: string | null, modelId: string | null, notConfigured: string): string {
  if (!providerId) return notConfigured
  if (modelId) return modelId
  return fmtProvider(providerId)
}

export function formatTtsProvider(providerId: string | null, notConfigured: string): string {
  if (!providerId || providerId === 'none') return notConfigured
  return fmtProvider(providerId)
}
