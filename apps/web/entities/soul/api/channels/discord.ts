import { apiFetch, jsonOrThrow } from '@/api/client'
import type { DiscordTokenValidationResponse } from '@/shared/types/soul-api'

export async function validateDiscordToken(
  botToken: string,
): Promise<DiscordTokenValidationResponse> {
  const res = await apiFetch('/api/v1/connectors/discord/token-validations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botToken }),
  })
  return jsonOrThrow<DiscordTokenValidationResponse>(res)
}

export async function getDiscordInstallUrl(cardId: string): Promise<string> {
  const res = await apiFetch(`/api/v1/connectors/discord/install-url?cardId=${cardId}`)
  const data = await jsonOrThrow<{ url: string }>(res)
  return data.url
}

export async function revokeDiscordChannel(channelId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/connectors/discord/channels/${channelId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Revoke failed: ${res.status}`)
}

export async function reconnectDiscordChannel(channelId: string): Promise<string> {
  const res = await apiFetch(`/api/v1/connectors/discord/channels/${channelId}/reconnections`, { method: 'POST' })
  const data = await jsonOrThrow<{ url: string }>(res)
  return data.url
}

export async function saveDiscordCustomBot(channelId: string, botToken: string | null): Promise<void> {
  const res = await apiFetch(`/api/v1/connectors/discord/channels/${channelId}/custom-bot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botToken }),
  })
  if (!res.ok) throw new Error(`Failed to save custom bot: ${res.status}`)
}
