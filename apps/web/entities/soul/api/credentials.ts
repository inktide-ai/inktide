import { apiFetch, jsonOrThrow } from '@/api/client'
import type {
  CredentialResponse,
  CredentialTestResponse,
} from '@/shared/types/soul-api'

export async function getCredentials(): Promise<CredentialResponse[]> {
  const res = await apiFetch('/api/v1/souls/credentials')
  return jsonOrThrow<CredentialResponse[]>(res)
}

export async function upsertCredential(
  providerId: string,
  apiKey: string | null,
  baseUrl?: string | null,
  config?: Record<string, unknown> | null,
): Promise<CredentialResponse> {
  const res = await apiFetch(`/api/v1/souls/credentials/${encodeURIComponent(providerId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey:  apiKey ?? null,
      baseUrl: baseUrl ?? null,
      config:  config ? JSON.stringify(config) : null,
    }),
  })
  return jsonOrThrow<CredentialResponse>(res)
}

export async function deleteCredential(providerId: string): Promise<void> {
  await apiFetch(`/api/v1/souls/credentials/${encodeURIComponent(providerId)}`, { method: 'DELETE' })
}

export async function testCredential(providerId: string): Promise<CredentialTestResponse> {
  const res = await apiFetch(`/api/v1/souls/credentials/${encodeURIComponent(providerId)}/test`, {
    method: 'POST',
  })
  return jsonOrThrow<CredentialTestResponse>(res)
}
