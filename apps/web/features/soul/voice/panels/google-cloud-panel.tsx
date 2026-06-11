'use client'

import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { useVoiceProvider } from '@/features/soul/hooks/useVoiceProvider'
import { SliderIcon, SpeedIcon } from '../voice-icons'
import { SelectField, ParamRow } from '../param-row'
import { ApiKeyConnectionPanel } from './api-key-panel'

export function GoogleCloudSettings() {
  const { t } = useTranslation('voice')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })
  const apiKey = tts.apiKey ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('google-cloud-tts', apiKey)

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.connection')}</h2>
        <ApiKeyConnectionPanel providerName="Google Cloud" providerId="google-cloud-tts" />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.voiceSection')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <SelectField
            label={t('panels.voice')}
            hint={!apiKey.trim() ? t('panels.hintEnterKey') : voicesLoading ? t('panels.loadingVoices') : t('panels.hintGoogleVoices')}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
            onChange={(v) => patch({ voiceId: v || null })}
          >
            <option value="">{t('panels.selectVoice')}</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}</option>)}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.parameters')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SliderIcon />} name={t('panels.pitch')} desc={t('panels.pitchSemitones')} min={-20} max={20} step={0.5} decimals={1} value={tts.pitch} onChange={(v) => patch({ pitch: v })} format={(v) => v > 0 ? `+${v}` : `${v}`} />
          <ParamRow icon={<SpeedIcon />} name={t('panels.speed')} desc={t('panels.speedOpenAi')} min={0.25} max={4.0} step={0.05} decimals={2} value={Math.min(4.0, Math.max(0.25, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
          <ParamRow icon={<SliderIcon />} name={t('panels.volume')} desc={t('panels.volumeDb')} min={-10} max={10} step={0.5} decimals={1} value={tts.volume} onChange={(v) => patch({ volume: v })} format={(v) => v > 0 ? `+${v} dB` : `${v} dB`} />
        </div>
      </section>
    </>
  )
}
