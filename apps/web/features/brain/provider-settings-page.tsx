'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LlmSliderGroup } from '@/shared/ui/llm-slider-group'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Headphones } from 'lucide-react'
import { Slider } from '@/shared/ui/slider'
import { LLM_PROVIDER_CATALOG } from '@/shared/data/llm-provider-catalog'
import type { CharacterLlm } from '@/shared/lib/character'
import { useCharactersContext } from '@/entities/character'
import { getChatModels, type ChatModelInfo } from '@/features/brain/api/chat'
import { getCredentials } from '@/features/soul'
import { CredentialStatusBadge, statusFromCredential } from '@/features/soul'
import { useCredentialTest } from '@/shared/lib/hooks/useCredentialTest'
import { cn } from '@/lib/utils'

const DEFAULT_OLLAMA_URL = process.env.NEXT_PUBLIC_DEFAULT_OLLAMA_URL ?? 'http://localhost:11434'

const inputCls = cn(
  'h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3',
  'text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]',
  'transition-colors focus:border-[var(--border-default)]',
)


const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[var(--text-tertiary)]" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM10.0293 18.1797C9.40197 18.6727 8.86879 19.1936 8.44336 19.7197C9.52565 20.2192 10.7298 20.5 12 20.5C12.1313 20.5 12.2618 20.4961 12.3916 20.4902C11.9765 20.2165 11.5679 19.8799 11.1748 19.4932C10.7848 19.1094 10.4014 18.6684 10.0293 18.1797ZM16.1689 15.3896C15.3482 15.5561 14.4955 15.8071 13.6338 16.1465C12.7717 16.4861 11.9768 16.885 11.2627 17.3232C11.5807 17.7366 11.9035 18.1059 12.2266 18.4238C12.8167 19.0045 13.3792 19.3907 13.8721 19.5908C14.3601 19.7888 14.7367 19.7887 15.0234 19.6758C15.3102 19.5628 15.5857 19.3066 15.8076 18.8291C16.0317 18.3466 16.1792 17.68 16.2148 16.8525C16.2343 16.3995 16.2183 15.9091 16.1689 15.3896ZM3.68652 10.2266C3.56508 10.7986 3.5 11.3917 3.5 12C3.5 14.8821 4.93604 17.4268 7.12988 18.9639C7.67413 18.2535 8.36634 17.5697 9.17773 16.9414C8.58338 15.9859 8.03922 14.9068 7.58008 13.7412C7.12089 12.5755 6.78339 11.4148 6.56641 10.3105C5.54325 10.4046 4.56985 10.3752 3.68652 10.2266ZM19.8652 15.2217C19.195 15.127 18.4497 15.1084 17.6543 15.1758C17.7155 15.7869 17.7374 16.3705 17.7139 16.917C17.6902 17.4675 17.6197 17.9917 17.5029 18.4746C18.5299 17.6009 19.3458 16.4885 19.8652 15.2217ZM13.5859 7.91309C12.7713 8.41864 11.875 8.87128 10.916 9.24902C9.95692 9.6268 8.99248 9.90693 8.05176 10.0928C8.24972 11.0761 8.55616 12.1242 8.97656 13.1914C9.39672 14.258 9.88757 15.2321 10.4131 16.0859C11.2278 15.5803 12.1249 15.1288 13.084 14.751C14.0428 14.3733 15.0068 14.0921 15.9473 13.9062C15.7493 12.9232 15.4437 11.8754 15.0234 10.8086C14.6031 9.74154 14.1117 8.76716 13.5859 7.91309ZM16.8691 5.03516C16.3249 5.74557 15.6328 6.42921 14.8213 7.05762C15.4159 8.01341 15.9606 9.09275 16.4199 10.2588C16.879 11.4241 17.2166 12.5845 17.4336 13.6885C18.4563 13.5945 19.4295 13.624 20.3125 13.7725C20.4338 13.2006 20.5 12.608 20.5 12C20.5 9.11744 19.0636 6.57217 16.8691 5.03516ZM6.49609 5.52441C5.46932 6.39798 4.65324 7.51074 4.13379 8.77734C4.80404 8.87209 5.54926 8.89057 6.34473 8.82324C6.28365 8.21254 6.26363 7.6292 6.28711 7.08301C6.31082 6.53226 6.37925 6.00757 6.49609 5.52441ZM10.1279 4.40918C9.63988 4.21119 9.26335 4.21128 8.97656 4.32422C8.68985 4.43716 8.41428 4.69346 8.19238 5.1709C7.96831 5.65336 7.82076 6.32008 7.78516 7.14746C7.76569 7.60015 7.78078 8.09038 7.83008 8.60938C8.65105 8.44294 9.50421 8.19304 10.3662 7.85352C11.2282 7.51395 12.0223 7.11398 12.7363 6.67578C12.4186 6.26294 12.0962 5.89375 11.7734 5.57617C11.1832 4.99548 10.6208 4.60924 10.1279 4.40918ZM11.6074 3.50879C12.023 3.78267 12.4317 4.12062 12.8252 4.50781C13.2147 4.89116 13.598 5.33121 13.9697 5.81934C14.5972 5.32627 15.1302 4.80546 15.5557 4.2793C14.4737 3.78018 13.2698 3.5 12 3.5C11.8684 3.5 11.7375 3.50287 11.6074 3.50879Z" fill="currentColor"/>
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[var(--text-tertiary)]" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C14.7614 2 17 4.23858 17 7V8.5H18.75C19.9926 8.5 21 9.50736 21 10.75V18.75C21 19.9926 19.9926 21 18.75 21H5.25C4.00736 21 3 19.9926 3 18.75V10.75C3 9.50736 4.00736 8.5 5.25 8.5H7V7C7 4.23858 9.23858 2 12 2ZM5.25 10C4.83579 10 4.5 10.3358 4.5 10.75V18.75C4.5 19.1642 4.83579 19.5 5.25 19.5H18.75C19.1642 19.5 19.5 19.1642 19.5 18.75V10.75C19.5 10.3358 19.1642 10 18.75 10H5.25ZM12 12C12.8284 12 13.5 12.6716 13.5 13.5C13.5 14.0953 13.152 14.6073 12.6494 14.8496L13.25 17.25H10.75L11.3496 14.8496C10.8474 14.6072 10.5 14.095 10.5 13.5C10.5 12.6716 11.1716 12 12 12ZM12 3.5C10.067 3.5 8.5 5.067 8.5 7V8.5H15.5V7C15.5 5.067 13.933 3.5 12 3.5Z" fill="currentColor"/>
  </svg>
)

const ComputerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[var(--text-tertiary)]" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M16.8495 1.99961C17.2571 1.99961 17.6086 1.99857 17.8964 2.02207C18.1927 2.0463 18.4877 2.10026 18.7714 2.24473C19.1946 2.46038 19.539 2.80492 19.7548 3.22813C19.8993 3.51172 19.9532 3.80682 19.9774 4.10313C20.0009 4.39079 19.9999 4.7425 19.9999 5.15V16.3492C19.9999 16.7567 20.0009 17.1084 19.9774 17.3961C19.9532 17.6924 19.8992 17.9875 19.7548 18.2711C19.5391 18.6944 19.1947 19.0388 18.7714 19.2545C18.6821 19.3 18.5911 19.3344 18.4999 19.3639V19.649C18.4999 19.9165 18.5 20.1635 18.4833 20.3678C18.4659 20.5806 18.4264 20.8136 18.3095 21.0436C18.1417 21.3728 17.874 21.6414 17.5448 21.8092C17.3146 21.9265 17.0811 21.9656 16.868 21.983C16.6638 21.9997 16.4178 21.9996 16.1503 21.9996H7.84949C7.58204 21.9996 7.33597 21.9997 7.13172 21.983C6.91871 21.9656 6.6851 21.9264 6.45496 21.8092C6.12596 21.6414 5.85802 21.3736 5.69031 21.0445C5.57317 20.8145 5.53391 20.5807 5.51649 20.3678C5.49983 20.1636 5.49988 19.9173 5.49988 19.65V19.3639C5.40877 19.3344 5.31761 19.2999 5.2284 19.2545C4.80514 19.0388 4.46068 18.6944 4.245 18.2711C4.10058 17.9875 4.04657 17.6924 4.02235 17.3961C3.99887 17.1084 3.99988 16.7567 3.99988 16.3492V5.15C3.99988 4.7425 3.99884 4.39079 4.02235 4.10313C4.04659 3.80682 4.10051 3.51172 4.245 3.22813C4.46073 2.80489 4.80513 2.4604 5.2284 2.24473C5.51207 2.10022 5.80701 2.0463 6.1034 2.02207C6.39113 1.99856 6.74265 1.99961 7.15028 1.99961H16.8495ZM8.49989 11.4996H15.4999V6.49961H8.49989V11.4996Z" fill="currentColor"/>
  </svg>
)

const MemoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[var(--text-tertiary)]" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3C16.8325 3 20.75 6.91751 20.75 11.75C20.75 16.5825 16.8325 20.5 12 20.5H6.11621L6.72461 21.1084C7.01747 21.4013 7.0174 21.876 6.72461 22.1689C6.43172 22.4618 5.95696 22.4618 5.66406 22.1689L3.71973 20.2246C3.42695 19.9317 3.42687 19.4569 3.71973 19.1641L5.66406 17.2197C5.95692 16.9269 6.43171 16.9269 6.72461 17.2197C7.0175 17.5126 7.0175 17.9874 6.72461 18.2803L6.00488 19H12C16.0041 19 19.25 15.7541 19.25 11.75C19.25 7.74594 16.0041 4.5 12 4.5C7.99594 4.5 4.75 7.74594 4.75 11.75V12C4.75 12.4142 4.41421 12.75 4 12.75C3.58579 12.75 3.25 12.4142 3.25 12V11.75C3.25 6.91751 7.16751 3 12 3Z" fill="currentColor"/>
  </svg>
)


function OllamaConnectionPanel() {
  const { t } = useTranslation('brain')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  const [models, setModels] = useState<ChatModelInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const llm = selected?.llm
  const baseUrl = llm?.baseUrl ?? DEFAULT_OLLAMA_URL

  useEffect(() => {
    let cancelled = false
    setError(false)
    const timer = setTimeout(() => {
      setLoading(true)
      getChatModels('ollama', baseUrl)
        .then((list) => { if (!cancelled) { setModels(list); setError(false) } })
        .catch(() => { if (!cancelled) { setModels([]); setError(true) } })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 500)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [baseUrl])

  if (!selected || !selectedId || !llm) return null

  const patch = (p: Partial<typeof llm>) =>
    updateCharacter(selectedId, { llm: { ...llm, ...p } })

  return (
    <div className="grid grid-cols-2 divide-x divide-[var(--border-subtle)]">
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-body font-medium text-[var(--text-primary)]">
          <ComputerIcon />
          {t('ps.serverUrl')}
        </div>
        <p className="mb-3 text-body text-[var(--text-tertiary)]">{t('ps.serverUrlDesc')}</p>
        <input
          className={inputCls}
          type="text"
          placeholder="http://localhost:11434"
          value={baseUrl}
          onChange={(e) => patch({ baseUrl: e.target.value || null })}
        />
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-body font-medium text-[var(--text-primary)]">
          <MemoryIcon />
          {t('model.label')}
        </div>
        <p className="mb-3 text-body text-[var(--text-tertiary)]">
          {loading ? t('model.loading') : error ? t('ps.ollamaUnreachable') : t('ps.selectLocalModel')}
        </p>
        <div className="relative">
          <select
            className={cn(inputCls, 'appearance-none cursor-pointer pr-8')}
            value={llm.modelId ?? ''}
            disabled={loading || models.length === 0}
            onChange={(e) => patch({ modelId: e.target.value || null })}
          >
            <option value="">{t('model.selectPlaceholder')}</option>
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-tertiary)]" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}


function RemoteConnectionPanel({ providerId }: { providerId: string }) {
  const { t } = useTranslation('brain')
  const def = LLM_PROVIDER_CATALOG.find((p) => p.id === providerId)
  const [apiKey, setApiKey] = useState('')
  const credTest = useCredentialTest(providerId)

  useEffect(() => {
    getCredentials()
      .then((creds) => {
        const cred = creds.find((c) => c.providerId === providerId)
        if (cred?.hasKey) credTest.setStatus(statusFromCredential(cred.verifiedAt, cred.lastError))
      })
      .catch(() => {})
    // credTest.setStatus is a stable useState setter - intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId])

  if (!def) return null

  const handleSave = async () => {
    if (!apiKey.trim()) return
    await credTest.test(apiKey, def.fixedBaseUrl ?? null)
  }

  return (
    <div className="grid grid-cols-2 divide-x divide-[var(--border-subtle)]">
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-body font-medium text-[var(--text-primary)]">
          <GlobeIcon />
          {t('ps.endpoint')}
        </div>
        <p className="text-body text-[var(--text-secondary)]">{def.fixedBaseUrl ?? t('ps.customEndpoint')}</p>
      </div>
      <div className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2 text-body font-medium text-[var(--text-primary)]">
            <LockIcon />
            {t('ps.apiKey')}
          </div>
          <CredentialStatusBadge status={credTest.status} error={credTest.error} />
        </div>
        <p className="mb-3 text-body text-[var(--text-tertiary)]">{t('ps.apiKeyDesc', { name: def.name })}</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); credTest.reset() }}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSave() }}
            placeholder="sk-..."
            className={cn(inputCls, 'flex-1')}
          />
          <button
            type="button"
            disabled={credTest.testing || !apiKey.trim()}
            onClick={() => void handleSave()}
            className="h-9 shrink-0 rounded-lg bg-[var(--accent-primary)] px-4 text-body font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {credTest.testing ? t('ps.saving') : t('ps.save')}
          </button>
        </div>
      </div>
    </div>
  )
}


export default function ProviderSettingsPage() {
  const { t } = useTranslation('brain')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  const params = useParams<{ id: string; providerId: string }>()

  const catalog = LLM_PROVIDER_CATALOG.find((p) => p.id === params.providerId)

  const [llmDraft, setLlmDraft] = useState<CharacterLlm | null>(selected?.llm ?? null)

  useEffect(() => {
    if (selected?.llm) setLlmDraft(selected.llm)
  }, [selected?.llm])

  if (!selected || !selectedId || !llmDraft) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">{t('ps.loading')}</div>
  }

  const patchDraft = (p: Partial<CharacterLlm>) => setLlmDraft((prev) => prev ? { ...prev, ...p } : prev)

  const handleSaveBehavior = () => {
    updateCharacter(selectedId, { llm: llmDraft })
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-[1200px]">

        <nav className="mb-6 flex items-center gap-2 text-body text-[var(--text-secondary)]">
          <Link href={`/souls/${params.id}/brain`} className="hover:text-[var(--text-primary)] transition-colors">
            {t('ps.brain')}
          </Link>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-primary)]">{catalog?.name ?? params.providerId}</span>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-primary)]">{t('settings')}</span>
        </nav>

        <div className="flex items-start justify-between pb-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-4">
            {catalog && (
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                <img src={catalog.iconSrc} alt={catalog.name} className="h-full w-full object-contain" draggable={false} />
              </div>
            )}
            <div>
              <h1 className="text-[22px] font-semibold leading-tight text-[var(--text-primary)]">
                {catalog?.name ?? params.providerId}
              </h1>
              <p className="mt-1 text-body text-[var(--text-secondary)]">
                {catalog?.description ?? t('ps.settingsDefault')}
              </p>
            </div>
          </div>
          {catalog && (catalog.supportUrl || catalog.websiteUrl) && (
            <div className="flex items-center gap-2 shrink-0 ml-6">
              {catalog.supportUrl && (
                <a
                  href={catalog.supportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3.5 py-2 text-body font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <Headphones size={14} className="text-[var(--text-secondary)]" />
                  {t('ps.support', { name: catalog.name })}
                </a>
              )}
              {catalog.websiteUrl && (
                <a
                  href={catalog.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--text-primary)] px-3.5 py-2 text-body font-medium text-[var(--bg-0)] hover:opacity-90 transition-opacity"
                >
                  {t('ps.openIn', { name: catalog.name })}
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-[1fr_300px] gap-8 items-start">

          <div className="flex flex-col gap-5">

            {/* Connection card */}
            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('ps.connection')}</h3>
                <p className="mt-1 text-body text-[var(--text-secondary)]">
                  {params.providerId === 'ollama'
                    ? t('ps.connectionOllama')
                    : t('ps.connectionRemote')}
                </p>
              </div>
              <div className="border-t border-[var(--border-subtle)]">
                {params.providerId === 'ollama'
                  ? <OllamaConnectionPanel />
                  : <RemoteConnectionPanel providerId={params.providerId} />
                }
              </div>
            </div>

            {/* Model Behavior card */}
            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('ps.modelBehavior')}</h3>
                <p className="mt-1 text-body text-[var(--text-secondary)]">{t('ps.modelBehaviorDesc')}</p>
              </div>
              <div className="px-6 py-5">
                <LlmSliderGroup
                  llm={llmDraft}
                  onPatch={patchDraft}
                  renderSlider={({ value, onChange, min, max, step }) => (
                    <div className="flex items-center gap-3">
                      <Slider
                        value={value} onChange={onChange}
                        min={min} max={max} step={step}
                        fill="var(--text-primary)" trackHeight={4} thumbSize={14}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min={min} max={max} step={step}
                        value={value}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
                        }}
                        className="w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] py-1 text-center text-body text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border-default)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                  )}
                />
              </div>
              <div className="flex items-center justify-end px-6 py-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={handleSaveBehavior}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-2 text-body font-semibold text-[var(--bg-0)] hover:opacity-90 transition-opacity"
                >
                  {t('ps.saveChanges')}
                </button>
              </div>
            </div>

          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
            <div className="px-6 pt-5 pb-4">
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('ps.about')}</h3>
            </div>
            <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
              {catalog ? [
                { label: t('ps.provider'), value: catalog.name },
                { label: t('ps.kind'), value: catalog.kind },
                { label: t('model.label'), value: catalog.model },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-6 py-3">
                  <span className="text-body text-[var(--text-secondary)]">{row.label}</span>
                  <span className="text-body text-[var(--text-primary)]">{row.value}</span>
                </div>
              )) : (
                <div className="px-6 py-3">
                  <p className="text-body text-[var(--text-tertiary)]">{t('ps.noInfo')}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
