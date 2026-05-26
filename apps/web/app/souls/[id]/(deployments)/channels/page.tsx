'use client'

import { useState } from 'react'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import ChannelTab from '@/features/character-editor/tabs/channel-tab'
import { cn } from '@/lib/utils'

const FILTERS = ['All', 'Streaming', 'Chat', 'Social'] as const
export type ChannelFilter = typeof FILTERS[number]

export default function SoulChannelsPage() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  const [filter, setFilter] = useState<ChannelFilter>('All')

  if (!selected || !selectedId) {
    return (
      <div className="p-8 text-sm text-[var(--text-secondary)]">Loading…</div>
    )
  }

  return (
    <div className="px-5 py-4 space-y-3">
      <div className="overflow-hidden rounded-lg border border-[var(--border-card)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-divider)]">
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Connected channels</p>
            <p className="text-[14px] text-[var(--text-tertiary)] mt-0.5">Connect your streaming and social platforms to your soul.</p>
          </div>
          <div role="tablist" className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                role="tab"
                type="button"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  'h-7 whitespace-nowrap rounded-full px-3 text-[0.8125rem] font-medium transition-all duration-150 outline-none',
                  filter === f
                    ? 'bg-black/[0.06] dark:bg-white/[0.11] text-[var(--text-primary)] hover:bg-black/[0.10] dark:hover:bg-white/[0.16]'
                    : 'bg-transparent text-[var(--text-tertiary)] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-[var(--text-secondary)]',
                )}
              >
                {f === 'All' ? 'View all' : f}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-4">
          <ChannelTab
            character={selected}
            onUpdate={(patch) => updateCharacter(selectedId, patch)}
          />
        </div>
      </div>
    </div>
  )
}
