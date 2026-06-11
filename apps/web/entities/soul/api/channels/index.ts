import { apiFetch, emptyOrThrow, jsonOrThrow } from '@/api/client'
import type {
  ChannelResponse,
  CreateChannelLinkRequest,
} from '@/shared/types/soul-api'
import { saveDiscordCustomBot } from './discord'

export * from './discord'
export * from './telegram'
export * from './twitch'

export async function createCardChannel(
  cardId: string,
  body: CreateChannelLinkRequest,
): Promise<ChannelResponse> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/channels`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<ChannelResponse>(res)
}

export async function patchCardChannel(
  cardId: string,
  linkId: string,
  body: { is_active: boolean },
): Promise<ChannelResponse> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/channels/${linkId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: body.is_active }),
  })
  return jsonOrThrow<ChannelResponse>(res)
}

export async function deleteCardChannel(cardId: string, linkId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/channels/${linkId}`, { method: 'DELETE' })
  await emptyOrThrow(res)
}

export async function createDiscordCustomBotChannel(cardId: string, botToken: string): Promise<void> {
  const channelRes = await createCardChannel(cardId, {
    platform: 'discord',
    channel_name: 'Custom Bot',
    bot_username: '',
    channel_id: '',
  })
  await saveDiscordCustomBot(channelRes.id, botToken)
}
