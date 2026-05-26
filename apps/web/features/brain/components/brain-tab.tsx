'use client'

import { useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { AiCharacter } from '@/shared/lib/character'
import { PROVIDER_DEFS } from '@/lib/providers'
import { OllamaPanel } from './ollama-panel'
import { RemoteProviderPanel } from './remote-provider-panel'
import { LlmParametersPanel } from './llm-parameters-panel'

// ── Section layout styles (local to BrainTab) ─────────────────────────────────

const sectionCls = 'flex flex-col gap-3 border-t border-(--border) pt-4 mt-6 [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0'
const sectionTitle = 'text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2'

// ── Provider card type ────────────────────────────────────────────────────────

interface LlmProviderDef {
  id: string
  name: string
  description: string
  icon: string
}

// ── Main component ────────────────────────────────────────────────────────────

interface BrainTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const BrainTab = ({ character, onUpdate }: BrainTabProps) => {
  const { t } = useTranslation(['brain'])
  const router = useRouter()
  const { providerId } = useParams<{ providerId?: string }>()
  const [search, setSearch] = useState('')

  const providerDescriptions: Record<string, string> = {
    ollama:    t('brain:providers.ollama'),
    anthropic: t('brain:providers.anthropic'),
    deepseek:  t('brain:providers.deepseek'),
  }

  const PROVIDERS = useMemo((): LlmProviderDef[] =>
    PROVIDER_DEFS.map((p) => ({
      id: p.id, name: p.name, icon: p.icon,
      description: providerDescriptions[p.id] ?? p.description,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [t])

  if (providerId) {
    const provider = PROVIDERS.find((p) => p.id === providerId)
    return (
      <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
        <div className="flex items-center gap-3 mb-7 pb-4 border-b border-white/[0.06]">
          <button
            type="button"
            className="flex items-center justify-center w-7 h-7 bg-white/[0.04] border border-[#2d2f33] rounded-[6px] text-white/45 cursor-pointer transition-all duration-[120ms] ease shrink-0 hover:border-[#42454d] hover:text-white/85 hover:bg-white/[0.07]"
            onClick={() => router.push('/settings/brain')}
            aria-label="Back"
          >←</button>
          <span className="text-[1rem] font-semibold text-(--text-primary) tracking-[-0.01em]">
            {provider?.icon} {provider?.name ?? providerId} {t('brain:settings')}
          </span>
        </div>

        <div className={sectionCls} style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div>
            {providerId === 'ollama'
              ? <OllamaPanel character={character} onUpdate={onUpdate} />
              : <RemoteProviderPanel providerId={providerId} character={character} onUpdate={onUpdate} />
            }
          </div>
        </div>

        <div className={sectionCls}>
          <div className={sectionTitle}>{t('brain:llmParams')}</div>
          <div>
            <LlmParametersPanel character={character} onUpdate={onUpdate} />
          </div>
        </div>
      </div>
    )
  }

  const filtered = PROVIDERS.filter(
    (p) => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      <div className="mb-[0.875rem] pb-[0.875rem] border-b border-white/[0.06]">
        <div className="text-[0.625rem] font-bold text-white/38 tracking-[0.09em] uppercase mb-[0.3rem]">{t('brain:grid.title')}</div>
        <div className="text-[0.8125rem] text-white/50 leading-[1.55]">{t('brain:grid.desc')}</div>
      </div>

      <div className="relative flex items-center">
        <svg className="absolute left-4 text-[0.9375rem] text-white/20 pointer-events-none leading-none transition-[color] duration-150 ease [.providerSearchWrap:focus-within_&]:text-white/40" width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          className="w-full py-[0.6875rem] pr-4 pl-10 bg-white/[0.03] border border-white/[0.06] rounded-[0.625rem] text-(--text-primary) font-[var(--font-ui)] text-[0.875rem] outline-none transition-[background,border-color] duration-150 ease placeholder:text-white/20 focus:bg-white/[0.05] focus:border-white/10"
          type="text"
          placeholder={t('brain:grid.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(195px,1fr))] gap-[0.375rem] mt-[0.875rem]">
        {filtered.map((provider) => {
          const isActive = character.llm.providerId === provider.id
          return (
            <div
              key={provider.id}
              className={cn(
                'relative bg-[#1e1f22] border border-[#2d2f33] border-l-2 border-l-transparent rounded-[8px] p-4 cursor-pointer transition-[background,border-color] duration-[120ms] ease flex flex-col min-h-[114px] overflow-hidden select-none outline-none hover:bg-[#26282e] hover:border-[#42454d] focus-visible:shadow-[0_0_0_2px_rgba(53,116,240,0.4)]',
                isActive && 'border-[#2a5040] border-l-[#22c55e] bg-[#162820] hover:bg-[#1a3025] hover:border-[#2a5040]',
              )}
              role="button"
              tabIndex={0}
              onClick={() => { if (!isActive) onUpdate({ llm: { ...character.llm, providerId: provider.id } }) }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isActive) onUpdate({ llm: { ...character.llm, providerId: provider.id } }) }}
            >
              <div className="absolute top-[0.875rem] right-[0.875rem] text-[2.25rem] opacity-10 leading-none pointer-events-none">{provider.icon}</div>
              <div className="text-[0.8125rem] font-semibold text-(--text-primary) leading-[1.3]">{provider.name}</div>
              <div className="text-[0.6875rem] text-white/38 leading-[1.45] mt-[0.2rem]">{provider.description}</div>
              <div className="flex items-center justify-between mt-auto pt-[0.625rem]">
                <div className={cn('w-[14px] h-[14px] rounded-full border-[1.5px] border-white/15 shrink-0 transition-all duration-150 ease flex items-center justify-center', isActive && 'border-[#22c55e] bg-[#22c55e]')} />
                <button
                  type="button"
                  className="inline-flex items-center gap-[0.2rem] text-[0.6875rem] font-medium text-white/35 bg-transparent border-none p-0 cursor-pointer font-[inherit] transition-[color] duration-[120ms] ease leading-none hover:text-white/70"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdate({ llm: { ...character.llm, providerId: provider.id } })
                    router.push(`/settings/providers/${provider.id}`)
                  }}
                >
                  {t('brain:grid.configure')}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BrainTab
