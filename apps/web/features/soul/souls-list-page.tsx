'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Rows3, Search } from 'lucide-react'
import type { SoulCardData, AiCardListItem } from '@/features/soul'
import { SoulCardVertical, SoulListRow, SortableSoulCard, useFavorites, reorderCard, toSoulCardData } from '@/features/soul'
import { useCharactersContext } from '@/entities/character'
import { queryKeys } from '@/shared/lib/query/keys'
import { PageContent } from '@/shared/ui'

const listVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
}

const cardVariant: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

type SoulsFilter = 'all' | 'active' | 'idle' | 'archived'
type SoulsView = 'grid' | 'list'

export default function SoulsListPage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const queryClient = useQueryClient()
  const { cardList, loading } = useCharactersContext()
  const { favs, toggle } = useFavorites()
  const [filter, setFilter] = useState<SoulsFilter>('all')
  const [view, setView] = useState<SoulsView>('grid')
  const [query, setQuery] = useState('')

  const FILTERS: Array<{ id: SoulsFilter, label: string }> = [
    { id: 'all', label: t('filter.all') },
    { id: 'active', label: t('filter.active') },
    { id: 'idle', label: t('filter.idle') },
    { id: 'archived', label: t('filter.archived') },
  ]

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const isDndEnabled = filter === 'all' && query === '' && view !== 'list'

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

  const dndCards = filtered.map(soul => (
    <SortableSoulCard
      key={soul.id}
      soul={soul}
      isFavorite={favs.has(soul.id)}
      onFavoriteToggle={() => toggle(soul.id)}
      onOpen={() => router.push(`/souls/${soul.id}`)}
    />
  ))

  return (
    <PageContent>
        <header className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-sans text-[36px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{t('souls.title')}</h1>
            <p className="mt-1 text-body text-[var(--text-secondary)]">{t('souls.subtitle')}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-[240px] items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3">
              <Search size={15} className="text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('souls.searchPlaceholder')}
                className="w-full bg-transparent text-body text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
              <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-2xs text-[var(--text-secondary)]">
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
              className="flex h-10 items-center gap-1 rounded-xl bg-[var(--accent-primary)] px-3 text-body font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              {t('souls.newSoul')}
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
                  className={`h-8 rounded-lg px-4 text-body transition-colors ${
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
            <button
              type="button"
              title={view === 'list' ? t('souls.switchToGrid') : t('souls.switchToList')}
              onClick={() => setView(v => v === 'list' ? 'grid' : 'list')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                view === 'list'
                  ? 'bg-[var(--sidebar-active)] text-[var(--accent-hover)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
              }`}
            >
              <Rows3 size={14} />
            </button>

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
          view === 'list' ? (
            <div className="rounded-2xl overflow-hidden border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-[hsla(var(--bg-1),_1)]" />
              ))}
            </div>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-body text-[var(--text-secondary)]">
              {t('souls.loading')}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-body text-[var(--text-secondary)]">
            {t('souls.noResults')}
          </div>
        ) : view === 'list' ? (
          <div className="rounded-2xl overflow-hidden border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {filtered.map(soul => (
              <SoulListRow
                key={soul.id}
                data={soul}
                isFavorite={favs.has(soul.id)}
                onFavoriteToggle={() => toggle(soul.id)}
                onOpen={() => router.push(`/souls/${soul.id}`)}
              />
            ))}
          </div>
        ) : isDndEnabled ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map(s => s.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3 xl:grid-cols-4">
                {dndCards}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3 xl:grid-cols-4"
            variants={listVariants}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence>
              {filtered.map(soul => (
                <motion.div
                  key={soul.id}
                  variants={cardVariant}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  whileHover={{ scale: 1.012, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.995 }}
                >
                  <SoulCardVertical
                    data={soul}
                    isFavorite={favs.has(soul.id)}
                    onFavoriteToggle={() => toggle(soul.id)}
                    onOpen={() => router.push(`/souls/${soul.id}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
    </PageContent>
  )
}
