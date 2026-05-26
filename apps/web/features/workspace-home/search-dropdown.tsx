'use client'
import { useEffect, useRef } from 'react'
import { Bot, Folder } from 'lucide-react'
import type { SearchResult } from '@/shared/hooks/useSearch'

interface SearchDropdownProps {
  results: SearchResult[]
  activeIndex: number
  onSelect: (result: SearchResult) => void
  onClose: () => void
}

function ResultIcon({ result }: { result: SearchResult }) {
  if (result.avatarUrl) {
    return (
      <img
        src={result.avatarUrl}
        alt=""
        className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
      />
    )
  }
  const Icon = result.type === 'soul' ? Bot : Folder
  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)]">
      <Icon size={13} />
    </div>
  )
}

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  soul: 'Souls',
  project: 'Projects',
}

export function SearchDropdown({ results, activeIndex, onSelect, onClose }: SearchDropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.closest('[data-search-root]')?.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (results.length === 0) {
    return (
      <div
        ref={ref}
        className="absolute left-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] shadow-xl"
      >
        <p className="home-ui-font px-4 py-3 text-[14px] text-[var(--text-tertiary)]">No results</p>
      </div>
    )
  }

  // Group by type in order they appear
  const groups: SearchResult['type'][] = []
  for (const r of results) {
    if (!groups.includes(r.type)) groups.push(r.type)
  }

  let globalIndex = 0

  return (
    <div
      ref={ref}
      className="absolute left-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-1)] shadow-xl"
    >
      {groups.map(group => {
        const items = results.filter(r => r.type === group)
        return (
          <div key={group}>
            <p className="home-ui-font px-3 pb-1 pt-2.5 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              {TYPE_LABEL[group]}
            </p>
            {items.map(result => {
              const idx = globalIndex++
              const isActive = idx === activeIndex
              return (
                <button
                  key={result.id}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); onSelect(result) }}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                    isActive
                      ? 'bg-[var(--sidebar-active)]'
                      : 'hover:bg-[var(--surface-1)]'
                  }`}
                >
                  <ResultIcon result={result} />
                  <div className="min-w-0">
                    <p className="home-ui-font truncate text-[14px] font-medium text-[var(--text-primary)]">
                      {result.name}
                    </p>
                    {result.description && (
                      <p className="home-ui-font truncate text-[12px] text-[var(--text-tertiary)]">
                        {result.description}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )
      })}
      <div className="home-ui-font border-t border-[var(--border-subtle)] px-3 py-2 text-[12px] text-[var(--text-tertiary)]">
        ↑↓ navigate · Enter select · Esc close
      </div>
    </div>
  )
}
