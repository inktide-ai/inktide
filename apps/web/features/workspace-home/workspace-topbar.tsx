'use client'

import { useTranslation } from 'react-i18next'
import { Add, CaretDownSmall, Notification, Search } from '@/shared/ui/icons'
import { useSearch } from '@/features/workspace-home/hooks/useSearch'
import { SearchDropdown } from './search-dropdown'

interface WorkspaceTopBarProps {
  onCreateSoul?: () => void
}

export function WorkspaceTopBar({ onCreateSoul }: WorkspaceTopBarProps = {}) {
  const { query, setQuery, results, isOpen, activeIndex, inputRef, close, navigate, handleKeyDown } = useSearch()
  const { t } = useTranslation('common')

  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="pl-12 lg:pl-0">
        <h1 className="font-sans text-[26px] font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[34px]">{t('home.title')}</h1>
        <p className="home-ui-font mt-1 text-[15px] font-medium text-[var(--text-secondary)]">
          {t('home.subtitle')}
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:flex-none" data-search-root>
          <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] px-3 sm:w-[240px] md:w-[280px]">
            <Search size={15} className="text-[var(--text-tertiary)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('home.searchPlaceholder')}
              className="home-ui-font w-full bg-transparent text-body font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
            {!query && (
              <span className="home-ui-font rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-body font-medium text-[var(--text-secondary)]">
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
        >
          <Notification size={15} />
        </button>

        <button
          type="button"
          onClick={onCreateSoul}
          className="home-ui-font flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-[var(--accent-primary)] px-3 text-body font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          <Add size={15} />
          {t('home.newSoul')}
          <CaretDownSmall size={14} />
        </button>
      </div>
    </header>
  )
}
