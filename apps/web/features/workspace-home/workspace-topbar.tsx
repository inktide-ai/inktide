'use client'

import { Add, CaretDownSmall, Notification, Search } from '@/components/icons'
import { useSearch } from '@/features/workspace-home/hooks/useSearch'
import { SearchDropdown } from './search-dropdown'

interface WorkspaceTopBarProps {
  onCreateSoul?: () => void
}

export function WorkspaceTopBar({ onCreateSoul }: WorkspaceTopBarProps = {}) {
  const { query, setQuery, results, isOpen, activeIndex, inputRef, close, navigate, handleKeyDown } = useSearch()

  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-[34px] font-bold tracking-[-0.03em] text-[var(--text-primary)]">Dashboard</h1>
        <p className="home-ui-font mt-1 text-[15px] font-medium text-[var(--text-secondary)]">
          All your souls, projects and creations in one place.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" data-search-root>
          <div className="flex h-10 w-[280px] items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3">
            <Search size={15} className="text-[var(--text-tertiary)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search souls, projects..."
              className="home-ui-font w-full bg-transparent text-[14px] font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
            {!query && (
              <span className="home-ui-font rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[14px] font-medium text-[var(--text-secondary)]">
                ⌘K
              </span>
            )}
          </div>

          {isOpen && (
            <SearchDropdown
              results={results}
              activeIndex={activeIndex}
              onSelect={navigate}
              onClose={close}
            />
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
        >
          <Notification size={15} />
        </button>

        <button
          type="button"
          onClick={onCreateSoul}
          className="home-ui-font flex h-10 items-center gap-1 rounded-xl bg-[var(--accent-primary)] px-3 text-[14px] font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          <Add size={15} />
          New soul
          <CaretDownSmall size={14} />
        </button>
      </div>
    </header>
  )
}
