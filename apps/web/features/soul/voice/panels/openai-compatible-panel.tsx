'use client'

import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { GlobeIcon, LockIcon, SpeedIcon } from '../voice-icons'
import { inputCls, ParamRow } from '../param-row'

export function OpenAiCompatibleSettings() {
  const { t } = useTranslation('voice')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.connection')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <GlobeIcon />
              {t('baseUrl.label')} <span className="text-[var(--accent-base)]">*</span>
            </div>
            <p className="mb-3 text-xs text-[var(--text-tertiary)]">{t('baseUrl.hintCompatible')}</p>
            <input className={inputCls} type="text" placeholder="http://localhost:1234/v1" value={tts.baseUrl ?? ''} onChange={(e) => patch({ baseUrl: e.target.value || null })} />
          </div>
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <LockIcon />
              {t('apiKey.label')}
            </div>
            <p className="mb-3 text-xs text-[var(--text-tertiary)]">{t('apiKey.hintCompatible')}</p>
            <input type="password" value={tts.apiKey ?? ''} onChange={(e) => patch({ apiKey: e.target.value || null })} placeholder="sk-..." autoComplete="new-password" className={inputCls} />
          </div>
        </div>
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.voiceModel')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <div className="p-5">
            <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">{t('panels.voiceId')}</div>
            <p className="mb-3 text-xs text-[var(--text-tertiary)]">{t('voice.hintCompatible')}</p>
            <input className={inputCls} type="text" placeholder="alloy" value={tts.voiceId ?? ''} onChange={(e) => patch({ voiceId: e.target.value || null })} />
          </div>
          <div className="p-5">
            <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">{t('panels.modelId')}</div>
            <p className="mb-3 text-xs text-[var(--text-tertiary)]">{t('model.hintCompatible')}</p>
            <input className={inputCls} type="text" placeholder="tts-1" value={tts.modelId ?? ''} onChange={(e) => patch({ modelId: e.target.value || null })} />
          </div>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.parameters')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SpeedIcon />} name={t('speed.label')} desc={t('speed.hintOpenAi')} min={0.25} max={4.0} step={0.05} decimals={2} value={Math.min(4.0, Math.max(0.25, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
        </div>
      </section>
    </>
  )
}
