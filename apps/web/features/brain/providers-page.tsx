'use client'

import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { BrainProviderCard, getCredentials, statusFromCredential, type CredentialResponse } from '@/features/soul'
import { LLM_PROVIDER_CATALOG } from '@/shared/data/llm-provider-catalog'
import { useCharactersContext } from '@/entities/character'
import { cn } from '@/lib/utils'
import { FeaturedIntegrations } from '@/features/character-editor'
import {
  GridIcon, CaretDownIcon, SearchIcon,
  ComputerIcon, LockIcon, CodeIcon, GithubIcon, StarIcon, TrustIcon, XSmallIcon,
} from '@/features/soul/components/brain-icons'

const TYPE_ICONS: Record<string, ({ className }: { className?: string }) => JSX.Element> = {
  'local':       ComputerIcon,
  'api-key':     LockIcon,
  'openai-v1':   CodeIcon,
  'open-source': GithubIcon,
  'recommended': StarIcon,
  'enterprise':  TrustIcon,
}


export default function ProvidersPage() {
  const { t } = useTranslation('providers')
  const { t: tc } = useTranslation('common')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [typeOpen, setTypeOpen] = useState(false)
  const [pendingTypes, setPendingTypes] = useState<Set<string>>(new Set())
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set())

  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [credMap, setCredMap] = useState<Map<string, CredentialResponse>>(new Map())

  const TYPE_DEFS = [
    { id: 'local',       label: t('brain.type.local'),        icon: '/images/icons/computer.svg' },
    { id: 'api-key',     label: t('brain.type.apiKey'),       icon: '/images/icons/lock.svg' },
    { id: 'openai-v1',   label: t('brain.type.openaiV1'),     icon: '/images/icons/code.svg' },
    { id: 'open-source', label: t('brain.type.openSource'),   icon: '/images/icons/github.svg' },
    { id: 'recommended', label: t('brain.type.recommended'),  icon: '/images/icons/star.svg' },
    { id: 'enterprise',  label: t('brain.type.enterprise'),   icon: '/images/icons/trust.svg' },
  ] as const

  useEffect(() => {
    getCredentials().then((creds) => {
      setCredMap(new Map(creds.map((c) => [c.providerId, c])))
    }).catch((err) => { console.error('[providers-page] failed to load credentials', err) })
  }, [])

  // counts per type across full catalog - dep is [] because LLM_PROVIDER_CATALOG is a
  // module-level const and the type IDs never change at runtime
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'local': 0, 'api-key': 0, 'openai-v1': 0,
      'open-source': 0, 'recommended': 0, 'enterprise': 0,
    }
    for (const p of LLM_PROVIDER_CATALOG)
      for (const typeId of p.types)
        if (typeId in counts) counts[typeId]++
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return LLM_PROVIDER_CATALOG.filter((p) => {
      const typeMatch = activeTypes.size === 0 || p.types.some((typeId) => activeTypes.has(typeId))
      const searchMatch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.kind.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q))
      return typeMatch && searchMatch
    })
  }, [search, activeTypes])

  // close dropdown on outside click
  useEffect(() => {
    if (!typeOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTypeOpen(false)
        setPendingTypes(new Set(activeTypes))
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [typeOpen, activeTypes])

  // focus search input when opened
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  const toggleType = useCallback((id: string) => {
    setPendingTypes((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const applyTypes = () => {
    setActiveTypes(new Set(pendingTypes))
    setTypeOpen(false)
  }

  const clearTypes = () => {
    setPendingTypes(new Set())
  }

  const selectAllTypes = () => {
    setPendingTypes(new Set(TYPE_DEFS.map((typeDef) => typeDef.id)))
  }

  const removeActiveType = (id: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setPendingTypes((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleSelectProvider = (providerId: string) => {
    if (selected && selectedId) {
      updateCharacter(selectedId, { llm: { ...selected.llm, providerId } })
    }
    router.push(`/souls/${params.id}/brain/${providerId}`)
  }

  const hasActiveFilters = activeTypes.size > 0
  const isTypeActive = hasActiveFilters

  return (
    <div className="mx-auto w-full max-w-7xl px-24 pb-14 pt-9 xl:max-w-[90rem]">
      <header className="mb-9">
        <h1 className="text-[1.625rem] font-semibold leading-8 text-[var(--text-heading)]">{t('brain.title')}</h1>
        <p className="mt-1 text-[1rem] leading-6 text-[var(--text-secondary)]">{t('brain.subtitle')}</p>
      </header>
      <FeaturedIntegrations baseHref={`/souls/${params.id}/brain`} type="brain" />
      <div>
      <div className="mb-6">
        <h2 className="text-[1.0625rem] font-semibold text-[var(--text-heading)]">{t('brain.section.title')}</h2>
        <p className="mt-0.5 text-body text-[var(--text-secondary)]">{t('brain.section.subtitle')}</p>
      </div>
      <div className="mb-4 flex items-center justify-between gap-2 py-1.5">
        {/* Type filter button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              if (!typeOpen) setPendingTypes(new Set(activeTypes))
              setTypeOpen((v) => !v)
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors duration-150',
              'border outline-none',
              isTypeActive
                ? 'border-[var(--color-blue-primary)] bg-blue-500/10 text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-card)] hover:text-[var(--text-primary)]',
            )}
          >
            <GridIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
            {tc('filter.type')}
            {isTypeActive && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-blue-primary)] text-2xs font-bold text-white leading-none">
                {activeTypes.size}
              </span>
            )}
            <CaretDownIcon className={cn('h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-150', typeOpen && 'rotate-180')} />
          </button>

          {/* Dropdown */}
          {typeOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <div className="py-1">
                {TYPE_DEFS.map((typeDef) => {
                  const checked = pendingTypes.has(typeDef.id)
                  return (
                    <button
                      key={typeDef.id}
                      type="button"
                      onClick={() => toggleType(typeDef.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--surface-card-hover)]"
                    >
                      {/* Checkbox */}
                      <span className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked
                          ? 'border-[var(--color-blue-primary)] bg-[var(--color-blue-primary)]'
                          : 'border-[var(--border-default)] bg-transparent',
                      )}>
                        {checked && (
                          <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {(() => { const Icon = TYPE_ICONS[typeDef.id]; return Icon ? <Icon className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" /> : null })()}
                      <span className="flex-1 text-sm text-[var(--text-primary)]">{typeDef.label}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">{typeCounts[typeDef.id]}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-3 py-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllTypes}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {tc('filter.selectAll')}
                  </button>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <button
                    type="button"
                    onClick={clearTypes}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {tc('filter.clear')}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={applyTypes}
                  className="rounded-md bg-[var(--color-blue-primary)] px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                >
                  {tc('filter.apply')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          {searchOpen && (
            <input
              ref={searchInputRef}
              type="search"
              placeholder={t('brain.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'h-8 w-48 rounded-lg border border-[var(--border-default)] bg-[var(--surface-input)] px-3',
                'text-sm text-[var(--text-primary)] outline-none transition-colors',
                'placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-strong)]',
              )}
            />
          )}
          <button
            type="button"
            onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setSearch('') }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
              searchOpen
                ? 'border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-card)] hover:text-[var(--text-primary)]',
            )}
          >
            <SearchIcon className="h-4 w-4 text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {Array.from(activeTypes).map((id) => {
            const def = TYPE_DEFS.find((typeDef) => typeDef.id === id)
            if (!def) return null
            return (
              <span
                key={id}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]"
              >
                {(() => { const Icon = TYPE_ICONS[id]; return Icon ? <Icon className="h-3.5 w-3.5 text-[var(--text-secondary)]" /> : null })()}
                {def.label}
                <button
                  type="button"
                  onClick={() => removeActiveType(id)}
                  className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <XSmallIcon className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                </button>
              </span>
            )
          })}
          <button
            type="button"
            onClick={() => { setActiveTypes(new Set()); setPendingTypes(new Set()) }}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {tc('filter.clearAll')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {filtered.map((provider) => {
          const cred = credMap.get(provider.id)
          return (
            <BrainProviderCard
              key={provider.id}
              provider={provider}
              selected={selected?.llm.providerId === provider.id}
              onSelect={() => handleSelectProvider(provider.id)}
              credentialStatus={cred ? statusFromCredential(cred.verifiedAt, cred.lastError) : undefined}
              credentialError={cred?.lastError}
            />
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-body text-[var(--text-tertiary)]">{t('brain.noResults')}</p>
      )}
      </div>
    </div>
  )
}
