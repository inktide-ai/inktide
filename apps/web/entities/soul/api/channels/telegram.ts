import { apiFetch, jsonOrThrow } from '@/api/client'
import type { TelegramValidateResponse } from '@/shared/types/soul-api'

export async function validateTelegramBotToken(botToken: string): Promise<TelegramValidateResponse> {
  const res = await apiFetch('/api/v1/connectors/telegram/token-validations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botToken }),
  })
  return jsonOrThrow<TelegramValidateResponse>(res)
}

export async function createTelegramChannel(
  cardId: string,
  botToken: string,
  chatId: string,
  chatName: string,
): Promise<void> {
  const res = await apiFetch('/api/v1/connectors/telegram/channels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, botToken, chatId, chatName }),
  })
  if (!res.ok) throw new Error(`Failed to create Telegram channel: ${res.status}`)
}

export async function revokeTelegramChannel(channelId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/connectors/telegram/channels/${channelId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Revoke failed: ${res.status}`)
}
