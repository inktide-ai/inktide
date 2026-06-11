import { apiFetch, jsonOrThrow } from '@/api/client'

export interface TtsCredentialResponse {
  providerId: string
  hasKey: boolean
  updatedAt: string
  verifiedAt: string | null
  lastError: string | null
}

export async function getTtsCredentials(): Promise<TtsCredentialResponse[]> {
  const res = await apiFetch('/api/v1/tts/credentials')
  return jsonOrThrow<TtsCredentialResponse[]>(res)
}

export async function upsertTtsCredential(
  providerId: string,
  apiKey: string,
): Promise<TtsCredentialResponse> {
  const res = await apiFetch(`/api/v1/tts/credentials/${encodeURIComponent(providerId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  })
  return jsonOrThrow<TtsCredentialResponse>(res)
}

export async function deleteTtsCredential(providerId: string): Promise<void> {
  await apiFetch(`/api/v1/tts/credentials/${encodeURIComponent(providerId)}`, { method: 'DELETE' })
}
