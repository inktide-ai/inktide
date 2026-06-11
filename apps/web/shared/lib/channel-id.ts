/**
 * InktideChat channel ID: "{cardId}:{userId}"
 * Both are standard UUIDs (lowercase, hyphenated).
 * Backend counterpart: InktideChatChannelId.cs + InktideChatChannelParser.cs
 */

export function buildChannelId(cardId: string, userId: string): string {
  if (!cardId || !userId) {
    throw new Error(
      `buildChannelId: invalid args. cardId=${JSON.stringify(cardId)} userId=${JSON.stringify(userId)}`
    )
  }
  return `${cardId}:${userId}`
}

export function parseChannelId(channelId: string): { cardId: string; userId: string } | null {
  const sep = channelId.indexOf(':')
  if (sep === -1) return null
  const cardId = channelId.slice(0, sep)
  const userId = channelId.slice(sep + 1)
  if (!cardId || !userId) return null
  return { cardId, userId }
}

export function isValidChannelId(channelId: string): boolean {
  return parseChannelId(channelId) !== null
}
