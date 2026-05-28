import { apiFetch, jsonOrThrow } from '@/api/client'

export async function getTwitchInstallUrl(cardId: string): Promise<string> {
  const res  = await apiFetch(`/api/connectors/twitch/install-url?cardId=${cardId}`)
  const data = await jsonOrThrow<{ url: string }>(res)
  return data.url
}

export async function revokeTwitchChannel(channelId: string): Promise<void> {
  const res = await apiFetch(`/api/connectors/twitch/revoke/${channelId}`, { method: 'POST' })
  if (!res.ok) throw new Error(`Revoke failed: ${res.status}`)
}

export async function reconnectTwitchChannel(channelId: string): Promise<string> {
  const res  = await apiFetch(`/api/connectors/twitch/reconnect/${channelId}`, { method: 'POST' })
  const data = await jsonOrThrow<{ url: string }>(res)
  return data.url
}
