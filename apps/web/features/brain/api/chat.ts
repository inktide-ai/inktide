import { apiFetch, jsonOrThrow } from '@/api/client'

// ── Response types ──

export interface ChatProviderCapabilities {
  supports_streaming: boolean
  supports_tools: boolean
  max_context_tokens: number
}

export interface ChatProviderDescriptor {
  id: string
  display_name: string
  capabilities: ChatProviderCapabilities
}

export interface ChatModelInfo {
  id: string
  name: string
}

// ── API functions ──

export function getChatProviders(): Promise<ChatProviderDescriptor[]> {
  return apiFetch('/api/v1/chat/providers').then((r) => jsonOrThrow<ChatProviderDescriptor[]>(r))
}

export function getChatModels(
  providerId: string,
  baseUrl?: string | null,
  apiKey?: string | null,
): Promise<ChatModelInfo[]> {
  const params = new URLSearchParams({ provider_id: providerId })
  if (baseUrl) params.set('base_url', baseUrl)
  const headers: Record<string, string> = {}
  if (apiKey) headers['X-Api-Key'] = apiKey
  return apiFetch(`/api/v1/chat/models?${params}`, { headers }).then((r) => jsonOrThrow<ChatModelInfo[]>(r))
}
