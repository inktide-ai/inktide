import type { SoulCardData, SoulPlatform, SoulStatus } from '@/components/hub/soul-card'
import type { AiCardListItem } from '@/api/soul'
import { splitPersonalityForSoulCard } from '@/lib/soul-card-personality'

const ACCENT_PALETTE = ['#8b5cf6', '#22d3ee', '#f43f5e', '#ec4899', '#f97316', '#60a5fa', '#a78bfa'] as const

function cardHash(id: string): number {
  let h = 5381
  for (let i = 0; i < id.length; i++) h = (((h << 5) + h) + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function statusFromCard(id: string, isActive: boolean): SoulStatus {
  if (!isActive) return 'idle'
  return cardHash(id) % 2 === 0 ? 'active' : 'online'
}

export function accentFromCard(id: string): string {
  return ACCENT_PALETTE[cardHash(id) % ACCENT_PALETTE.length]
}

export function toSoulCardData(card: AiCardListItem): SoulCardData {
  const { subtitle, description } = splitPersonalityForSoulCard(card.personality)
  return {
    id: card.id,
    name: card.name,
    subtitle,
    ...(description ? { description } : {}),
    avatarUrl: card.avatar_url || '/avatars/nova.png',
    accentColor: accentFromCard(card.id),
    status: statusFromCard(card.id, card.is_active),
    platforms: ['twitch', 'discord', 'telegram'] as SoulPlatform[],
  }
}
