'use client'
import { useEffect, useState } from 'react'
import { getCard } from '@/entities/soul/api'

export function useCardChannelId(cardId: string | undefined): string | null {
  const [channelId, setChannelId] = useState<string | null>(null)

  useEffect(() => {
    if (!cardId) return
    let cancelled = false
    getCard(cardId)
      .then((card) => {
        if (cancelled) return
        const active = card.channels?.find((ch) => ch.is_active && ch.channel_id)
        setChannelId(active?.channel_id ?? null)
      })
      .catch(() => { /* non-critical - audio just won't play */ })
    return () => { cancelled = true }
  }, [cardId])

  return channelId
}
