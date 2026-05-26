'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCharactersContext } from '@/context/CharactersContext'
import type { AiCardListItem } from '@/api/soul'

type Filter = 'all' | 'active' | 'idle' | 'archived'

const RING_COLORS = ['#8456FF', '#e88f3a', '#3ab5e8', '#e85e3a', '#3ae878', '#e83a9e']

function ringColor(index: number): string {
  return RING_COLORS[index % RING_COLORS.length]
}

function SoulCard({ card, index, onClick }: { card: AiCardListItem; index: number; onClick: () => void }) {
  const color = ringColor(index)
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 group outline-none"
    >
      <div className="relative">
        <div
          className="rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-2xl"
          style={{
            width: 110,
            height: 110,
            border: `3px solid ${color}`,
            background: 'linear-gradient(135deg, #8456FF, #EC4899)',
            boxShadow: `0 0 0 2px var(--bg-0), 0 0 20px ${color}33`,
          }}
        >
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.avatar_url}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            card.name.charAt(0).toUpperCase()
          )}
        </div>
        {/* Online indicator */}
        <span
          className="absolute top-1 right-1 block rounded-full border-2 border-[var(--bg-0)]"
          style={{ width: 12, height: 12, background: '#22c55e' }}
        />
      </div>
      <div className="text-center">
        <p className="text-[14px] font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors">
          {card.name}
        </p>
        <p className="text-[14px] text-[var(--text-secondary)] mt-0.5 max-w-[110px] truncate">
          {card.personality || card.description || 'Soul'}
        </p>
      </div>
    </button>
  )
}

function AddSoulCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 group outline-none"
    >
      <div
        className="rounded-full flex items-center justify-center transition-colors group-hover:border-[var(--border-default)]"
        style={{
          width: 110,
          height: 110,
          border: '2px dashed var(--border-subtle)',
          background: 'var(--surface-1)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[14px] font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
          Add{' '}
          <span className="text-[var(--accent-primary)]">Soul</span>
        </p>
      </div>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-full bg-[var(--surface-2)] animate-pulse" style={{ width: 110, height: 110 }} />
      <div className="h-3.5 w-16 rounded bg-[var(--surface-2)] animate-pulse" />
      <div className="h-3 w-20 rounded bg-[var(--surface-2)] animate-pulse" />
    </div>
  )
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'idle', label: 'Idle' },
  { key: 'archived', label: 'Archived' },
]

export default function SoulPicker() {
  const router = useRouter()
  const { cardList, loading } = useCharactersContext()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered =
    filter === 'all'      ? cardList
    : filter === 'active' ? cardList.filter(c => c.status === 'active')
    : filter === 'idle'   ? cardList.filter(c => c.status === 'paused')
    :                       cardList.filter(c => c.status === 'archived')

  return (
    <div className="flex h-full flex-col items-center justify-center bg-[var(--bg-0)]">
      <div className="flex flex-col items-center">
        <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight">
          Select a soul to work with
        </h1>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
          Each soul has its own memory, personality and workflow.
        </p>

        {/* Soul grid */}
        <div className="mt-10 flex flex-wrap justify-center gap-8">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              {filtered.map((card) => (
                <SoulCard
                  key={card.id}
                  card={card}
                  index={cardList.indexOf(card)}
                  onClick={() => router.push(`/edit/graph?characterId=${card.id}`)}
                />
              ))}
              <AddSoulCard onClick={() => router.push('/souls')} />
            </>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mt-10 flex items-center gap-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className="rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors outline-none"
              style={{
                background: filter === f.key ? 'var(--surface-2)' : 'transparent',
                color: filter === f.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            className="ml-1 grid h-8 w-8 place-items-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="More options"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
