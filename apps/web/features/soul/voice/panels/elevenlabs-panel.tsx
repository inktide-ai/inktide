'use client'

import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { useVoiceProvider } from '@/features/soul/hooks/useVoiceProvider'
import { ELEVENLABS_MODELS, stripModelPrefix } from '@/shared/data/voice-models'
import { SpeedIcon, SliderIcon } from '../voice-icons'
import { SelectField, ParamRow } from '../param-row'
import { ApiKeyConnectionPanel } from './api-key-panel'

export function ElevenLabsSettings() {
  const { t } = useTranslation('voice')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })
  const apiKey = tts.apiKey ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('elevenlabs', apiKey)

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.connection')}</h2>
        <ApiKeyConnectionPanel providerName="ElevenLabs" providerId="elevenlabs" />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.voiceModel')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <SelectField
            label={t('panels.voice')}
            hint={!apiKey.trim() ? t('panels.hintEnterKey') : voicesLoading ? t('panels.loadingVoices') : t('panels.hintElevenVoices')}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
            onChange={(v) => patch({ voiceId: v || null })}
          >
            <option value="">{t('panels.selectVoice')}</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}</option>)}
          </SelectField>
          <SelectField label={t('panels.model')} value={stripModelPrefix(tts.modelId, 'elevenlabs') ?? 'eleven_multilingual_v2'} onChange={(v) => patch({ modelId: v ? `elevenlabs/${v}` : null })}>
            {ELEVENLABS_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.parameters')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SliderIcon />} name={t('panels.stability')} desc={t('panels.stabilityDesc')} min={0} max={1} step={0.01} decimals={2} value={tts.stability} onChange={(v) => patch({ stability: v })} />
          <ParamRow icon={<SliderIcon />} name={t('panels.similarity')} desc={t('panels.similarityDesc')} min={0} max={1} step={0.01} decimals={2} value={tts.similarityBoost} onChange={(v) => patch({ similarityBoost: v })} />
          <ParamRow icon={<SliderIcon />} name={t('panels.style')} desc={t('panels.styleDesc')} min={0} max={1} step={0.01} decimals={2} value={tts.style} onChange={(v) => patch({ style: v })} />
          <ParamRow icon={<SpeedIcon />} name={t('panels.speed')} desc={t('panels.speedEleven')} min={0.7} max={1.2} step={0.01} decimals={2} value={Math.min(1.2, Math.max(0.7, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="w-5 shrink-0"><SliderIcon /></span>
            <div className="w-52 shrink-0">
              <p className="text-body font-medium text-[var(--text-primary)]">{t('panels.speakerBoost')}</p>
              <p className="mt-0.5 text-xs leading-snug text-[var(--text-tertiary)]">{t('panels.speakerBoostDesc')}</p>
            </div>
            <div className="flex-1" />
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" checked={tts.useSpeakerBoost} onChange={(e) => patch({ useSpeakerBoost: e.target.checked })} />
              <div className="h-5 w-9 rounded-full bg-[var(--border-default)] transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[var(--text-primary)] peer-checked:after:translate-x-4" />
            </label>
          </div>
        </div>
      </section>
    </>
  )
}
