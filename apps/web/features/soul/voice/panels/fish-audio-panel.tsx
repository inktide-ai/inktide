'use client'

import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { useVoiceProvider } from '@/features/soul/hooks/useVoiceProvider'
import { FISHAUDIO_MODELS, stripModelPrefix } from '@/shared/data/voice-models'
import { SpeedIcon } from '../voice-icons'
import { SelectField, ParamRow } from '../param-row'
import { ApiKeyConnectionPanel } from './api-key-panel'

export function FishAudioSettings() {
  const { t } = useTranslation('voice')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  // Hooks must run on every render: the early return below would
  // otherwise change the hook order once a character is selected.
  const apiKey = selected?.tts.apiKey ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('fishaudio', apiKey)

  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.connection')}</h2>
        <ApiKeyConnectionPanel providerName="Fish Audio" providerId="fish-audio" />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.voiceModel')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <SelectField
            label={t('panels.voice')}
            hint={!apiKey.trim() ? t('panels.hintEnterKey') : voicesLoading ? t('panels.loadingVoices') : t('panels.hintFishVoices')}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
            onChange={(v) => patch({ voiceId: v || null })}
          >
            <option value="">{t('panels.selectVoice')}</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}</option>)}
          </SelectField>
          <SelectField label={t('panels.model')} value={stripModelPrefix(tts.modelId, 'fish-audio') ?? 's2-pro'} onChange={(v) => patch({ modelId: v ? `fish-audio/${v}` : null })}>
            {FISHAUDIO_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.parameters')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SpeedIcon />} name={t('panels.speed')} desc={t('panels.speedMultiplier')} min={0.5} max={2.0} step={0.05} decimals={2} value={Math.min(2.0, Math.max(0.5, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
        </div>
      </section>
    </>
  )
}
