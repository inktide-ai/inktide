'use client'
import { useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { AiCharacter } from '@/shared/lib/character'
import VoiceSandboxTab from './voice-sandbox-tab'
import { KokoroPanel } from './voice/panels/kokoro-panel'
import { ElevenLabsPanel } from './voice/panels/elevenlabs-panel'
import { OpenAiTtsPanel } from './voice/panels/openai-tts-panel'
import { OpenAiCompatPanel } from './voice/panels/openai-compat-panel'
import { FishAudioPanel } from './voice/panels/fishaudio-panel'
import { CartesiaPanel } from './voice/panels/cartesia-panel'
import { GoogleCloudPanel } from './voice/panels/google-cloud-panel'
import { AzureSpeechPanel } from './voice/panels/azure-speech-panel'

const kokoroLogo      = '/images/providers/voice/kokoro.svg'
const elevenLabsLogo  = '/images/providers/voice/elevenlabs.svg'
const openaiLogo      = '/images/providers/common/openai.svg'
const fishAudioLogo   = '/images/providers/voice/fish.svg'
const azureLogo       = '/images/providers/voice/microsoft_azure.svg'
const googleCloudLogo = '/images/providers/voice/google_cloud.svg'
const cartesiaLogo    = '/images/providers/voice/cartesia.svg'

const sectionCls = 'flex flex-col gap-3 border-t border-(--border) pt-4 mt-6 [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0'

interface ProviderBadge { label: string; color: string }
interface ProviderDef {
  id: string; name: string; description: string; icon: string; iconSrc?: string
  requiresApiKey: boolean; hasSettings: boolean; badge?: ProviderBadge
}

function renderSettingsPanel(providerId: string, character: AiCharacter, onUpdate: (patch: Partial<AiCharacter>) => void) {
  switch (providerId) {
    case 'kokoro':            return <KokoroPanel character={character} onUpdate={onUpdate} />
    case 'elevenlabs':        return <ElevenLabsPanel character={character} onUpdate={onUpdate} />
    case 'fishaudio':         return <FishAudioPanel character={character} onUpdate={onUpdate} />
    case 'openai':            return <OpenAiTtsPanel character={character} onUpdate={onUpdate} />
    case 'openai-compatible': return <OpenAiCompatPanel character={character} onUpdate={onUpdate} />
    case 'cartesia':          return <CartesiaPanel character={character} onUpdate={onUpdate} />
    case 'google-cloud-tts':  return <GoogleCloudPanel character={character} onUpdate={onUpdate} />
    case 'azure-speech':      return <AzureSpeechPanel character={character} onUpdate={onUpdate} />
    default:                  return <div style={{ padding: '1rem 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }} />
  }
}

interface VoiceTabProps { character: AiCharacter; onUpdate: (patch: Partial<AiCharacter>) => void }

const VoiceTab = ({ character, onUpdate }: VoiceTabProps) => {
  const { t } = useTranslation('voice')
  const router = useRouter()
  const { providerId } = useParams<{ providerId?: string }>()
  const [search, setSearch] = useState('')

  const PROVIDERS = useMemo((): ProviderDef[] => [
    { id: 'none',              name: 'None',                   description: t('providers.none'),             icon: '🔇', requiresApiKey: false, hasSettings: false },
    { id: 'kokoro',            name: 'Kokoro',                 description: t('providers.kokoro'),           icon: '', iconSrc: kokoroLogo,      requiresApiKey: false, hasSettings: true,  badge: { label: t('badges.free'),    color: '#d4a84a' } },
    { id: 'elevenlabs',        name: 'ElevenLabs',             description: t('providers.elevenlabs'),       icon: '', iconSrc: elevenLabsLogo,  requiresApiKey: true,  hasSettings: true,  badge: { label: t('badges.popular'), color: '#c47fc4' } },
    { id: 'fishaudio',         name: 'Fish Audio',             description: t('providers.fishaudio'),        icon: '', iconSrc: fishAudioLogo,   requiresApiKey: true,  hasSettings: true },
    { id: 'openai',            name: 'OpenAI',                 description: t('providers.openai'),           icon: '', iconSrc: openaiLogo,      requiresApiKey: true,  hasSettings: true },
    { id: 'openai-compatible', name: 'OpenAI Compatible',      description: t('providers.openaiCompatible'), icon: '', iconSrc: openaiLogo,      requiresApiKey: true,  hasSettings: true },
    { id: 'cartesia',          name: 'Cartesia',               description: t('providers.cartesia'),         icon: '', iconSrc: cartesiaLogo,    requiresApiKey: true,  hasSettings: true,  badge: { label: t('badges.fast'),    color: '#7aafd4' } },
    { id: 'google-cloud-tts',  name: 'Google Cloud TTS',       description: t('providers.googleCloud'),      icon: '', iconSrc: googleCloudLogo, requiresApiKey: true,  hasSettings: true },
    { id: 'azure-speech',      name: 'Microsoft Azure Speech', description: t('providers.azureSpeech'),      icon: '', iconSrc: azureLogo,       requiresApiKey: true,  hasSettings: true },
  ], [t])

  if (providerId === 'sandbox') {
    return <VoiceSandboxTab character={character} onBack={() => router.push('/settings/voice')} />
  }

  if (providerId) {
    const provider = PROVIDERS.find((p) => p.id === providerId)
    return (
      <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
        <div className="flex items-center gap-3 mb-7 pb-4 border-b border-white/[0.06]">
          <button type="button" className="flex items-center justify-center w-7 h-7 bg-white/[0.04] border border-[#2d2f33] rounded-[6px] text-white/45 cursor-pointer transition-all duration-[120ms] ease shrink-0 hover:border-[#42454d] hover:text-white/85 hover:bg-white/[0.07]" onClick={() => router.push('/settings/voice')} aria-label={t('back')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {provider && (
            <div className="w-9 h-9 flex items-center justify-center shrink-0 [&>img]:w-9 [&>img]:h-9 [&>img]:object-contain [&>img]:rounded-[10px]">
              {provider.iconSrc ? <img src={provider.iconSrc} alt={provider.name} /> : <span className="text-[1.125rem] leading-none">{provider.icon}</span>}
            </div>
          )}
          <div>
            <div className="text-[1rem] font-semibold text-(--text-primary) tracking-[-0.01em]">{provider?.name ?? providerId}</div>
            <div className="text-[0.6875rem] text-white/38 mt-[0.1rem]">{t('settings')}</div>
          </div>
        </div>
        <div className={sectionCls} style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          {renderSettingsPanel(providerId, character, onUpdate)}
        </div>
      </div>
    )
  }

  const filtered = PROVIDERS.filter((p) => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  const activeProvider = PROVIDERS.find((p) => p.id === character.tts.providerId)
  const needsApiKey = !!(activeProvider?.requiresApiKey && !character.tts.apiKey?.trim())

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      <div className="mb-[0.875rem] pb-[0.875rem] border-b border-white/[0.06]">
        <div className="text-[0.625rem] font-bold text-white/38 tracking-[0.09em] uppercase mb-[0.3rem]">{t('grid.title')}</div>
        <div className="text-[0.8125rem] text-white/50 leading-[1.55]">{t('grid.desc')}</div>
      </div>

      <div className="relative flex items-center">
        <svg className="absolute left-4 text-[0.9375rem] text-white/20 pointer-events-none leading-none" width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input className="w-full py-[0.6875rem] pr-4 pl-10 bg-white/[0.03] border border-white/[0.06] rounded-[0.625rem] text-(--text-primary) font-[var(--font-ui)] text-[0.875rem] outline-none transition-[background,border-color] duration-150 ease placeholder:text-white/20 focus:bg-white/[0.05] focus:border-white/10" type="text" placeholder={t('grid.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {needsApiKey && activeProvider && (
        <div className="flex items-center gap-[0.875rem] py-[0.875rem] px-4 rounded-[0_10px_10px_0] shadow-[inset_3px_0_0_rgba(245,158,11,0.6),inset_0_0_0_0.5px_rgba(255,255,255,0.07)] bg-[#13151A] mb-3" role="alert">
          <div className="w-[38px] h-[38px] rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center shrink-0 text-[#f59e0b]" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L12.5 11H1.5L7 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 5.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7" cy="9.75" r="0.7" fill="currentColor"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.875rem] font-semibold text-(--text-primary) leading-[1.3]">{t('apiKeyBanner.title', { provider: activeProvider.name })}</div>
            <div className="text-[0.75rem] text-(--text-muted) mt-[0.2rem] leading-[1.4]">{t('apiKeyBanner.subtitle')}</div>
          </div>
          <button type="button" className="shrink-0 bg-white/[0.06] border border-[0.5px] border-white/12 rounded-[8px] py-2 px-4 text-[0.8125rem] font-semibold text-(--text-primary) cursor-pointer whitespace-nowrap font-[inherit] transition-[background,border-color] duration-150 hover:bg-white/10 hover:border-white/[0.18]" onClick={() => router.push(`/settings/providers/${activeProvider.id}`)}>
            {t('apiKeyBanner.cta')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(195px,1fr))] gap-[0.375rem] mt-[0.875rem]">
        {filtered.map((provider) => {
          const isActive = character.tts.providerId === provider.id
          const isWarning = isActive && provider.requiresApiKey && !character.tts.apiKey?.trim()
          return (
            <div
              key={provider.id}
              className={cn(
                'relative bg-[#1e1f22] border border-[#2d2f33] border-l-2 border-l-transparent rounded-[8px] p-4 cursor-pointer transition-[background,border-color] duration-[120ms] ease flex flex-col min-h-[114px] overflow-hidden select-none outline-none hover:bg-[#26282e] hover:border-[#42454d] focus-visible:shadow-[0_0_0_2px_rgba(53,116,240,0.4)]',
                isActive && !isWarning && 'border-[#2a5040] border-l-[#22c55e] bg-[#162820] hover:bg-[#1a3025] hover:border-[#2a5040]',
                isWarning && 'border-[rgba(245,158,11,0.35)] border-l-[rgba(245,158,11,0.75)] bg-[rgba(245,158,11,0.03)] hover:bg-[rgba(245,158,11,0.06)]',
              )}
              role="button"
              tabIndex={0}
              onClick={() => { if (!isActive) onUpdate({ tts: { ...character.tts, providerId: provider.id, voiceId: null, modelId: null } }) }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isActive) onUpdate({ tts: { ...character.tts, providerId: provider.id, voiceId: null, modelId: null } }) }}
            >
              {provider.badge && (
                <span className="absolute top-2 right-2 text-[0.6875rem] font-medium py-[0.15rem] px-2 rounded-full leading-[1.5] pointer-events-none whitespace-nowrap" style={{ color: provider.badge.color, background: `${provider.badge.color}14`, border: `1px solid ${provider.badge.color}30` }}>
                  {provider.badge.label}
                </span>
              )}
              <div className={cn('w-9 h-9 flex items-center justify-center mb-[0.625rem] shrink-0', !provider.iconSrc && 'bg-white/[0.05] border border-white/[0.08] rounded-[8px]')}>
                {provider.iconSrc ? <img src={provider.iconSrc} alt={provider.name} className="w-full h-full object-contain rounded-[10px]" /> : <span className="text-[1.5rem] leading-none">{provider.icon}</span>}
              </div>
              <div className="text-[0.8125rem] font-semibold text-(--text-primary) leading-[1.3]">{provider.name}</div>
              <div className="text-[0.6875rem] text-white/38 leading-[1.45] mt-[0.2rem]">{provider.description}</div>
              <div className="flex items-center justify-between mt-auto pt-[0.625rem]">
                <div className={cn('w-[14px] h-[14px] rounded-full border-[1.5px] border-white/15 shrink-0 transition-all duration-150 ease flex items-center justify-center', isActive && !isWarning && 'border-[#22c55e] bg-[#22c55e]', isWarning && 'border-[#f59e0b]')}>
                  {isActive && !isWarning && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  {isWarning && <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M3.5 2V4M3.5 5.5H3.51" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round"/></svg>}
                </div>
                {provider.hasSettings && (
                  <button type="button" className="inline-flex items-center gap-[0.2rem] text-[0.6875rem] font-medium text-white/35 bg-transparent border-none p-0 cursor-pointer font-[inherit] transition-[color] duration-[120ms] ease leading-none hover:text-white/70" onClick={(e) => { e.stopPropagation(); router.push(`/settings/providers/${provider.id}`) }}>
                    {t('grid.configure')}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        <div className="relative bg-[#1e1f22] border border-[#2d2f33] border-l-2 border-l-transparent rounded-[8px] p-4 cursor-pointer transition-[background,border-color] duration-[120ms] ease flex flex-col min-h-[114px] overflow-hidden select-none outline-none hover:bg-[#26282e] hover:border-[#42454d]" role="button" tabIndex={0} onClick={() => router.push('sandbox')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('sandbox') }}>
          <div className="w-9 h-9 flex items-center justify-center mb-[0.625rem] shrink-0 bg-white/[0.05] border border-white/[0.08] rounded-[8px]">
            <span className="text-[1.5rem] leading-none">🎙</span>
          </div>
          <div className="text-[0.8125rem] font-semibold text-(--text-primary) leading-[1.3]">{t('sandbox.title')}</div>
          <div className="text-[0.6875rem] text-white/38 leading-[1.45] mt-[0.2rem]">{t('sandbox.desc')}</div>
          <div className="flex items-center justify-between mt-auto pt-[0.625rem]">
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{t('sandbox.open')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceTab
