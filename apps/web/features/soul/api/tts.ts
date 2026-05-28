import { apiFetch, jsonOrThrow } from '@/api/client'

export interface SpeechProviderCapabilities {
  requiresApiKey: boolean
  supportsVoiceListing: boolean
  supportsStreaming: boolean
}

export interface SpeechProviderDescriptor {
  id: string
  displayName: string
  capabilities: SpeechProviderCapabilities
}

/** Voice with optional display metadata returned by GET /api/v1/tts/voices. */
export interface SpeechVoice {
  id: string
  name?: string | null
  category?: string | null
  labels?: Record<string, string> | null
}

export async function getTtsProviders(): Promise<SpeechProviderDescriptor[]> {
  const res = await apiFetch('/api/v1/tts/providers')
  return jsonOrThrow<SpeechProviderDescriptor[]>(res)
}

export async function getTtsVoices(providerId: string, apiKey?: string): Promise<SpeechVoice[]> {
  const headers: Record<string, string> = {}
  if (apiKey) headers['X-TTS-Api-Key'] = apiKey
  const res = await apiFetch(
    `/api/v1/tts/voices?provider_id=${encodeURIComponent(providerId)}`,
    { headers },
  )
  return jsonOrThrow<SpeechVoice[]>(res)
}
