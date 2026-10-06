'use client'

import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { SILERO_VOICES } from '@/shared/data/voice-providers'
import { SpeedIcon } from '../voice-icons'
import { SelectField, ParamRow } from '../param-row'

export function SileroSettings() {
  const { t } = useTranslation('voice')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.voiceSection')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <SelectField label={t('panels.voice')} hint={t('panels.hintSileroVoice')} value={tts.voiceId ?? ''} onChange={(v) => patch({ voiceId: v || null })}>
            <option value="">{t('panels.selectVoice')}</option>
            {SILERO_VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.parameters')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SpeedIcon />} name={t('panels.speed')} desc={t('panels.speedPlayback')} min={0.5} max={2.0} step={0.05} decimals={2} value={tts.speed} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
        </div>
      </section>
    </>
  )
}
