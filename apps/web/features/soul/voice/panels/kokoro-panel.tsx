'use client'

import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { LANG_LABELS, VOICE_GROUPS } from '@/shared/data/kokoro-voices'
import { GlobeIcon, SpeedIcon } from '../voice-icons'
import { inputCls, SelectField, ParamRow } from '../param-row'

export function KokoroSettings() {
  const { t } = useTranslation('voice')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.connection')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <GlobeIcon />
              {t('panels.serverUrl')}
            </div>
            <p className="mb-3 text-xs text-[var(--text-tertiary)]">{t('panels.kokoroServerDesc')}</p>
            <input className={inputCls} type="text" placeholder="http://127.0.0.1:8880/v1" value={tts.baseUrl ?? ''} onChange={(e) => patch({ baseUrl: e.target.value || null })} />
          </div>
        </div>
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.voiceSection')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <SelectField label={t('panels.voice')} hint={t('panels.hintKokoroVoice')} value={tts.voiceId ?? ''} onChange={(v) => patch({ voiceId: v || null })}>
            <option value="">{t('panels.selectVoice')}</option>
            {Array.from(VOICE_GROUPS.entries()).map(([lang, voices]) => (
              <optgroup key={lang} label={LANG_LABELS[lang] ?? lang}>
                {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </optgroup>
            ))}
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
