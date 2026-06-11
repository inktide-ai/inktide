import { apiFetch, jsonOrThrow } from '@/api/client'

export async function getTwitchInstallUrl(cardId: string): Promise<string> {
  const res  = await apiFetch(`/api/v1/connectors/twitch/install-url?cardId=${cardId}`)
  const data = await jsonOrThrow<{ url: string }>(res)
  return data.url
}

export async function revokeTwitchChannel(channelId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/connectors/twitch/channels/${channelId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Revoke failed: ${res.status}`)
}

export async function reconnectTwitchChannel(channelId: string): Promise<string> {
  const res  = await apiFetch(`/api/v1/connectors/twitch/channels/${channelId}/reconnections`, { method: 'POST' })
  const data = await jsonOrThrow<{ url: string }>(res)
  return data.url
}
