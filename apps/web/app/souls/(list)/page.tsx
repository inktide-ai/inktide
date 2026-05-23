'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bell, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, Rows3, Search, SquareDashedBottom } from 'lucide-react'
import { type SoulCardData, type SoulPlatform, type SoulStatus } from '@/components/hub/soul-card'
import { SoulCardVertical } from '@/components/hub/soul-card-vertical'
import { splitPersonalityForSoulCard } from '@/lib/soul-card-personality'
import { useCharactersContext } from '@/context/CharactersContext'
import { useFavorites } from '@/hooks/useFavorites'
import { reorderCard, type AiCardListItem } from '@/api/soul'
import { queryKeys } from '@/lib/query/keys'

type SoulsFilter = 'all' | 'active' | 'idle' | 'archived'
type SoulsView = 'grid' | 'list' | 'compact'

const FILTERS: Array<{ id: SoulsFilter, label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'idle', label: 'Idle' },
  { id: 'archived', label: 'Archived' },
]

const ACCENT_PALETTE = ['#8b5cf6', '#22d3ee', '#f43f5e', '#ec4899', '#f97316', '#60a5fa', '#a78bfa']

function statusFromCard(id: string, isActive: boolean): SoulStatus {
  if (!isActive) return 'idle'
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return hash % 2 === 0 ? 'active' : 'online'
}

function accentFromCard(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length]
}

function toSoulCardData(card: AiCardListItem): SoulCardData {
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

interface SortableSoulCardProps {
  soul: SoulCardData
  isFavorite: boolean
  onFavoriteToggle: () => void
  onOpen: () => void
}

function SortableSoulCard({ soul, isFavorite, onFavoriteToggle, onOpen }: SortableSoulCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: soul.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      {...attributes}
      {...listeners}
    >
      <SoulCardVertical
        data={soul}
        isFavorite={isFavorite}
        onFavoriteToggle={onFavoriteToggle}
        onOpen={onOpen}
      />
    </div>
  )
}

export default function SoulsListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { cardList, loading } = useCharactersContext()
  const { favs, toggle } = useFavorites()
  const [filter, setFilter] = useState<SoulsFilter>('all')
  const [view, setView] = useState<SoulsView>('grid')
  const [query, setQuery] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const isDndEnabled = filter === 'all' && query === '' && view === 'grid'

  const souls = useMemo<SoulCardData[]>(() => cardList.map(toSoulCardData), [cardList])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const byFilter = souls.filter(soul => {
      if (filter === 'all') return true
      if (filter === 'active') return soul.status === 'active' || soul.status === 'online'
      if (filter === 'idle') return soul.status === 'idle'
      return false
    })
    if (!q) return byFilter
    return byFilter.filter(soul =>
      soul.name.toLowerCase().includes(q)
      || soul.subtitle.toLowerCase().includes(q)
      || (soul.description?.toLowerCase().includes(q) ?? false),
    )
  }, [souls, filter, query])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const current = queryClient.getQueryData<AiCardListItem[]>(queryKeys.souls.all) ?? []
    const oldIdx = current.findIndex(c => c.id === active.id)
    const newIdx = current.findIndex(c => c.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = arrayMove(current, oldIdx, newIdx)
    queryClient.setQueryData(queryKeys.souls.all, reordered)

    const neighborIdx = reordered.findIndex(c => c.id === active.id)
    const previousId = reordered[neighborIdx - 1]?.id ?? null
    const nextId     = reordered[neighborIdx + 1]?.id ?? null

    void reorderCard(active.id as string, { previous_id: previousId, next_id: nextId })
      .catch(() => queryClient.invalidateQueries({ queryKey: queryKeys.souls.all }))
  }

  const gridContent = filtered.map(soul => (
    isDndEnabled
      ? (
        <SortableSoulCard
          key={soul.id}
          soul={soul}
          isFavorite={favs.has(soul.id)}
          onFavoriteToggle={() => toggle(soul.id)}
          onOpen={() => router.push(`/souls/${soul.id}`)}
        />
      )
      : (
        <SoulCardVertical
          key={soul.id}
          data={soul}
          isFavorite={favs.has(soul.id)}
          onFavoriteToggle={() => toggle(soul.id)}
          onOpen={() => router.push(`/souls/${soul.id}`)}
        />
      )
  ))

  return (
    <div className="min-h-screen bg-[var(--bg-0)] px-6 py-6 font-[Inter,sans-serif]">
      <div className="mx-auto max-w-[1300px]">
        <header className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Souls</h1>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Your AI characters and personalities</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-[240px] items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3">
              <Search size={15} className="text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search souls..."
                className="w-full bg-transparent text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
              <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
                ⌘K
              </span>
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            >
              <Bell size={15} />
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-1 rounded-xl bg-[var(--accent-primary)] px-3 text-[14px] font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              + New Soul
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {FILTERS.map(tab => {
              const active = tab.id === filter
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`h-8 rounded-lg px-4 text-[14px] transition-colors ${
                    active
                      ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                      : 'bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  view === 'grid'
                    ? 'bg-[var(--sidebar-active)] text-[var(--accent-hover)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  view === 'list'
                    ? 'bg-[var(--sidebar-active)] text-[var(--accent-hover)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <Rows3 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setView('compact')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  view === 'compact'
                    ? 'bg-[var(--sidebar-active)] text-[var(--accent-hover)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <SquareDashedBottom size={14} />
              </button>
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-[320px] items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[14px] text-[var(--text-secondary)]">
            Loading souls...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[14px] text-[var(--text-secondary)]">
            No souls found.
          </div>
        ) : isDndEnabled ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map(s => s.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3 xl:grid-cols-4">
                {gridContent}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3 xl:grid-cols-4">
            {gridContent}
          </div>
        )}
      </div>
    </div>
  )
}
