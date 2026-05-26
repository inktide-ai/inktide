'use client'

import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { VoiceProviderCard } from '@/features/soul/components/voice-provider-card'
import { VOICE_PROVIDER_CATALOG } from '@/shared/data/voice-providers'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { cn } from '@/lib/utils'
import { getCredentials, type CredentialResponse } from '@/features/soul/api/index'
import { statusFromCredential } from '@/features/soul/components/credential-status-badge'
import { FeaturedIntegrations } from '@/components/featured-integrations'

// ── Toolbar icons ─────────────────────────────────────────────────────────────

const GridIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8.75 13.5C9.7165 13.5 10.5 14.2835 10.5 15.25V19.25C10.5 20.2165 9.7165 21 8.75 21H4.75C3.7835 21 3 20.2165 3 19.25V15.25C3 14.2835 3.7835 13.5 4.75 13.5H8.75ZM19.25 13.5C20.2165 13.5 21 14.2835 21 15.25V19.25C21 20.2165 20.2165 21 19.25 21H15.25C14.2835 21 13.5 20.2165 13.5 19.25V15.25C13.5 14.2835 14.2835 13.5 15.25 13.5H19.25ZM4.75 15C4.61193 15 4.5 15.1119 4.5 15.25V19.25C4.5 19.3881 4.61193 19.5 4.75 19.5H8.75C8.88807 19.5 9 19.3881 9 19.25V15.25C9 15.1119 8.88807 15 8.75 15H4.75ZM15.25 15C15.1119 15 15 15.1119 15 15.25V19.25C15 19.3881 15.1119 19.5 15.25 19.5H19.25C19.3881 19.5 19.5 19.3881 19.5 19.25V15.25C19.5 15.1119 19.3881 15 19.25 15H15.25ZM8.75 3C9.7165 3 10.5 3.7835 10.5 4.75V8.75C10.5 9.7165 9.7165 10.5 8.75 10.5H4.75C3.7835 10.5 3 9.7165 3 8.75V4.75C3 3.7835 3.7835 3 4.75 3H8.75ZM19.25 3C20.2165 3 21 3.7835 21 4.75V8.75C21 9.7165 20.2165 10.5 19.25 10.5H15.25C14.2835 10.5 13.5 9.7165 13.5 8.75V4.75C13.5 3.7835 14.2835 3 15.25 3H19.25ZM4.75 4.5C4.61193 4.5 4.5 4.61193 4.5 4.75V8.75C4.5 8.88807 4.61193 9 4.75 9H8.75C8.88807 9 9 8.88807 9 8.75V4.75C9 4.61193 8.88807 4.5 8.75 4.5H4.75ZM15.25 4.5C15.1119 4.5 15 4.61193 15 4.75V8.75C15 8.88807 15.1119 9 15.25 9H19.25C19.3881 9 19.5 8.88807 19.5 8.75V4.75C19.5 4.61193 19.3881 4.5 19.25 4.5H15.25Z" fill="currentColor"/>
  </svg>
)
const CaretDownIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M16.4697 8.96973C16.7626 8.67684 17.2373 8.67684 17.5302 8.96973C17.8231 9.26263 17.8231 9.7374 17.5302 10.0303L12.5302 15.0303C12.2373 15.3232 11.7626 15.3231 11.4697 15.0303L6.46967 10.0303C6.17678 9.73738 6.17678 9.26262 6.46967 8.96973C6.76256 8.67684 7.23732 8.67684 7.53022 8.96973L11.9999 13.4395L16.4697 8.96973Z" fill="currentColor"/>
  </svg>
)
const SearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2C14.4183 2 18 5.58172 18 10C18 11.939 17.3088 13.7158 16.1611 15.1006L21.7803 20.7197C22.073 21.0126 22.0731 21.4874 21.7803 21.7803C21.4874 22.0731 21.0126 22.073 20.7197 21.7803L15.1006 16.1611C13.7158 17.3088 11.939 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2ZM10 3.5C6.41015 3.5 3.5 6.41015 3.5 10C3.5 13.5899 6.41015 16.5 10 16.5C13.5899 16.5 16.5 13.5899 16.5 10C16.5 6.41015 13.5899 3.5 10 3.5Z" fill="currentColor"/>
  </svg>
)
const ComputerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M16.8495 1.99961H7.15028C6.74265 1.99961 6.39113 1.99856 6.1034 2.02207C5.80701 2.0463 5.51207 2.10022 5.2284 2.24473C4.80513 2.4604 4.46073 2.80489 4.245 3.22813C4.10051 3.51172 4.04659 3.80682 4.02235 4.10313C3.99884 4.39079 3.99988 4.7425 3.99988 5.15V16.3492C3.99988 16.7567 3.99887 17.1084 4.02235 17.3961C4.04657 17.6924 4.10058 17.9875 4.245 18.2711C4.46068 18.6944 4.80514 19.0388 5.2284 19.2545C5.31761 19.2999 5.40877 19.3344 5.49988 19.3639V19.65C5.49988 19.9173 5.49983 20.1636 5.51649 20.3678C5.53391 20.5807 5.57317 20.8145 5.69031 21.0445C5.85802 21.3736 6.12596 21.6414 6.45496 21.8092C6.6851 21.9264 6.91871 21.9656 7.13172 21.983C7.33597 21.9997 7.58204 21.9996 7.84949 21.9996H16.1503C16.4178 21.9996 16.6638 21.9997 16.868 21.983C17.0811 21.9656 17.3146 21.9265 17.5448 21.8092C17.874 21.6414 18.1417 21.3728 18.3095 21.0436C18.4264 20.8136 18.4659 20.5806 18.4833 20.3678C18.5 20.1635 18.4999 19.9165 18.4999 19.649V19.3639C18.5911 19.3344 18.6821 19.3 18.7714 19.2545C19.1947 19.0388 19.5391 18.6944 19.7548 18.2711C19.8992 17.9875 19.9532 17.6924 19.9774 17.3961C20.0009 17.1084 19.9999 16.7567 19.9999 16.3492V5.15C19.9999 4.7425 20.0009 4.39079 19.9774 4.10313C19.9532 3.80682 19.8993 3.51172 19.7548 3.22813C19.539 2.80492 19.1946 2.46038 18.7714 2.24473C18.4877 2.10026 18.1927 2.0463 17.8964 2.02207C17.6086 1.99857 17.2571 1.99961 16.8495 1.99961ZM8.49989 11.4996H15.4999V6.49961H8.49989V11.4996Z" fill="currentColor"/>
  </svg>
)
const LockIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C14.7614 2 17 4.23858 17 7V8.5H18.75C19.9926 8.5 21 9.50736 21 10.75V18.75C21 19.9926 19.9926 21 18.75 21H5.25C4.00736 21 3 19.9926 3 18.75V10.75C3 9.50736 4.00736 8.5 5.25 8.5H7V7C7 4.23858 9.23858 2 12 2ZM5.25 10C4.83579 10 4.5 10.3358 4.5 10.75V18.75C4.5 19.1642 4.83579 19.5 5.25 19.5H18.75C19.1642 19.5 19.5 19.1642 19.5 18.75V10.75C19.5 10.3358 19.1642 10 18.75 10H5.25ZM12 12C12.8284 12 13.5 12.6716 13.5 13.5C13.5 14.0953 13.152 14.6073 12.6494 14.8496L13.25 17.25H10.75L11.3496 14.8496C10.8474 14.6072 10.5 14.095 10.5 13.5C10.5 12.6716 11.1716 12 12 12ZM12 3.5C10.067 3.5 8.5 5.067 8.5 7V8.5H15.5V7C15.5 5.067 13.933 3.5 12 3.5Z" fill="currentColor"/>
  </svg>
)
const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C6.475 2.25 2 6.60878 2 11.9903C2 16.3004 4.8625 19.9408 8.8375 21.2314C9.3375 21.3166 9.525 21.0244 9.525 20.7687C9.525 20.5374 9.5125 19.7703 9.5125 18.9546C7 19.4051 6.35 18.358 6.15 17.8101C6.0375 17.5301 5.55 16.6656 5.125 16.4343C4.775 16.2517 4.275 15.8012 5.1125 15.789C5.9 15.7768 6.4625 16.4952 6.65 16.7874C7.55 18.2606 8.9875 17.8466 9.5625 17.591C9.65 16.9578 9.9125 16.5317 10.2 16.2882C7.975 16.0447 5.65 15.2046 5.65 11.4789C5.65 10.4197 6.0375 9.54304 6.675 8.86122C6.575 8.61772 6.225 7.61934 6.775 6.28005C6.775 6.28005 7.6125 6.02436 9.525 7.27843C10.325 7.05927 11.175 6.94969 12.025 6.94969C12.875 6.94969 13.725 7.05927 14.525 7.27843C16.4375 6.01219 17.275 6.28005 17.275 6.28005C17.825 7.61934 17.475 8.61772 17.375 8.86122C18.0125 9.54304 18.4 10.4075 18.4 11.4789C18.4 15.2168 16.0625 16.0447 13.8375 16.2882C14.2 16.5926 14.5125 17.177 14.5125 18.0901C14.5125 19.3929 14.5 20.44 14.5 20.7687C14.5 21.0244 14.6875 21.3288 15.1875 21.2314C19.1375 19.9408 22 16.2882 22 11.9903C22 6.60878 17.525 2.25 12 2.25Z" fill="currentColor"/>
  </svg>
)
const XSmallIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M16.2147 6.71961C16.5075 6.42679 16.9824 6.42695 17.2753 6.71961C17.5682 7.0125 17.5682 7.48726 17.2753 7.78015L13.0575 11.9969L17.2753 16.2147C17.5682 16.5076 17.5682 16.9834 17.2753 17.2762C16.9824 17.5687 16.5075 17.5689 16.2147 17.2762L11.997 13.0585L7.78016 17.2762C7.48738 17.5688 7.01246 17.5687 6.71962 17.2762C6.42698 16.9834 6.42691 16.5076 6.71962 16.2147L10.9364 11.9969L6.71962 7.78015C6.42683 7.48725 6.42676 7.01246 6.71962 6.71961C7.01248 6.42677 7.48727 6.42682 7.78016 6.71961L11.997 10.9364L16.2147 6.71961Z" fill="currentColor"/>
  </svg>
)

// Voice-specific icons (loaded as <img> with ui-icon class for theme)
const VoiceFilterIcon = ({ className }: { className?: string }) => (
  <img src="/images/icons/voice.svg" alt="" className={cn('ui-icon', className)} />
)
const CloningFilterIcon = ({ className }: { className?: string }) => (
  <img src="/images/icons/copy.svg" alt="" className={cn('ui-icon', className)} />
)

// ── Settings components ───────────────────────────────────────────────────────

// ── Type filter definitions ────────────────────────────────────────────────────

const TYPE_DEFS = [
  { id: 'local',       label: 'Local',          Icon: ({ className }: { className?: string }) => <ComputerIcon className={className} /> },
  { id: 'api-key',     label: 'API Key',         Icon: ({ className }: { className?: string }) => <LockIcon className={className} /> },
  { id: 'streaming',   label: 'Streaming',       Icon: VoiceFilterIcon },
  { id: 'cloning',     label: 'Voice Cloning',   Icon: CloningFilterIcon },
  { id: 'open-source', label: 'Open Source',     Icon: ({ className }: { className?: string }) => <GithubIcon className={className} /> },
] as const

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SoulVoicePage() {
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

  useEffect(() => {
    getCredentials().then((creds) => {
      setCredMap(new Map(creds.map((c) => [c.providerId, c])))
    }).catch(() => {})
  }, [])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const t of TYPE_DEFS) counts[t.id] = 0
    for (const p of VOICE_PROVIDER_CATALOG) {
      for (const t of p.types) if (t in counts) counts[t]++
    }
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return VOICE_PROVIDER_CATALOG.filter((p) => {
      const typeMatch = activeTypes.size === 0 || p.types.some((t) => activeTypes.has(t))
      const searchMatch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.kind.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      return typeMatch && searchMatch
    })
  }, [search, activeTypes])

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

  const applyTypes = () => { setActiveTypes(new Set(pendingTypes)); setTypeOpen(false) }
  const clearTypes = () => setPendingTypes(new Set())
  const selectAllTypes = () => setPendingTypes(new Set(TYPE_DEFS.map((t) => t.id)))

  const removeActiveType = (id: string) => {
    setActiveTypes((prev) => { const n = new Set(prev); n.delete(id); return n })
    setPendingTypes((prev) => { const n = new Set(prev); n.delete(id); return n })
  }

  const handleSelectProvider = (providerId: string) => {
    if (selected && selectedId) {
      updateCharacter(selectedId, { tts: { ...selected.tts, providerId, voiceId: null, modelId: null } })
    }
    router.push(`/souls/${params.id}/voice/${providerId}`)
  }

  const hasActiveFilters = activeTypes.size > 0
  const isTypeActive = hasActiveFilters

  return (
    <div className="mx-auto w-full max-w-7xl px-24 pb-14 pt-9 xl:max-w-[90rem]">
      <header className="mb-9">
        <h1 className="text-[1.625rem] font-semibold leading-8 text-[var(--text-heading)]">Voice</h1>
        <p className="mt-1 text-[1rem] leading-6 text-[var(--text-secondary)]">Choose a TTS provider and configure your soul&apos;s voice.</p>
      </header>
      <FeaturedIntegrations baseHref={`/souls/${params.id}/voice`} type="voice" />
      <div>
      {/* ── Providers section ───────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-[1.0625rem] font-semibold text-[var(--text-heading)]">Voice Providers</h2>
        <p className="mt-0.5 text-[0.875rem] text-[var(--text-secondary)]">Select a text-to-speech engine to power your soul&apos;s voice.</p>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between gap-2 py-1.5">
        {/* Type filter */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => { if (!typeOpen) setPendingTypes(new Set(activeTypes)); setTypeOpen((v) => !v) }}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.8125rem] font-medium transition-colors duration-150',
              'border outline-none',
              isTypeActive
                ? 'border-[#3B82F6] bg-blue-500/10 text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-card)] hover:text-[var(--text-primary)]',
            )}
          >
            <GridIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
            Type
            {isTypeActive && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#3B82F6] text-[10px] font-bold text-white leading-none">
                {activeTypes.size}
              </span>
            )}
            <CaretDownIcon className={cn('h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-150', typeOpen && 'rotate-180')} />
          </button>

          {typeOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <div className="py-1">
                {TYPE_DEFS.map((t) => {
                  const checked = pendingTypes.has(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleType(t.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--surface-card-hover)]"
                    >
                      <span className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked ? 'border-[#3B82F6] bg-[#3B82F6]' : 'border-[var(--border-default)] bg-transparent',
                      )}>
                        {checked && (
                          <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <t.Icon className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                      <span className="flex-1 text-[0.8125rem] text-[var(--text-primary)]">{t.label}</span>
                      <span className="text-[0.75rem] text-[var(--text-tertiary)]">{typeCounts[t.id]}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-3 py-2">
                <div className="flex gap-2">
                  <button type="button" onClick={selectAllTypes} className="text-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Select all</button>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <button type="button" onClick={clearTypes} className="text-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Clear</button>
                </div>
                <button type="button" onClick={applyTypes} className="rounded-md bg-[#3B82F6] px-3 py-1 text-[0.75rem] font-semibold text-white hover:bg-blue-500 transition-colors">
                  Apply
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
              placeholder="Search providers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'h-8 w-48 rounded-lg border border-[var(--border-default)] bg-[var(--surface-input)] px-3',
                'text-[0.8125rem] text-[var(--text-primary)] outline-none transition-colors',
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

      {/* ── Active filter chips ──────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {Array.from(activeTypes).map((id) => {
            const def = TYPE_DEFS.find((t) => t.id === id)
            if (!def) return null
            return (
              <span key={id} className="flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-2.5 py-1 text-[0.75rem] font-medium text-[var(--text-primary)]">
                <def.Icon className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                {def.label}
                <button type="button" onClick={() => removeActiveType(id)} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity">
                  <XSmallIcon className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                </button>
              </span>
            )
          })}
          <button
            type="button"
            onClick={() => { setActiveTypes(new Set()); setPendingTypes(new Set()) }}
            className="text-[0.75rem] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map((provider) => {
          const cred = credMap.get(provider.id)
          return (
            <VoiceProviderCard
              key={provider.id}
              provider={provider}
              selected={selected?.tts.providerId === provider.id}
              onSelect={() => handleSelectProvider(provider.id)}
              credentialStatus={cred ? statusFromCredential(cred.verifiedAt, cred.lastError) : undefined}
              credentialError={cred?.lastError}
            />
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-[0.875rem] text-[var(--text-tertiary)]">No providers match your filters.</p>
      )}
      </div>
    </div>
  )
}
