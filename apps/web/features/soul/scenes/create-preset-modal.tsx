'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Slider } from '@/shared/ui/slider'
import type { RunPreset, CreateRunPresetRequest, LlmModelResponse, TtsVoiceResponse } from '@/features/soul/api/index'

const EMOTION_PRESETS = [
  { id: 'friendly',   labelKey: 'preset.emotionFriendly' },
  { id: 'energetic',  labelKey: 'preset.emotionEnergetic' },
  { id: 'tactical',   labelKey: 'preset.emotionTactical' },
  { id: 'cozy',       labelKey: 'preset.emotionCozy' },
  { id: 'chaotic',    labelKey: 'preset.emotionChaotic' },
  { id: 'companion',  labelKey: 'preset.emotionCompanion' },
  { id: 'therapist',  labelKey: 'preset.emotionTherapist' },
]

interface CreatePresetModalProps {
  open: boolean
  editing: RunPreset | null
  llmModels: LlmModelResponse[]
  ttsVoices: TtsVoiceResponse[]
  onClose: () => void
  onSubmit: (body: CreateRunPresetRequest) => Promise<void>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="home-ui-font block text-body font-medium text-[var(--text-secondary)] mb-1">
      {children}
    </label>
  )
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-[8px] border border-[var(--border-card)] bg-[var(--surface-0)] px-3 py-2 text-body text-[var(--text-primary)] outline-none focus:border-[var(--accent-base)] transition-colors"
    >
      {children}
    </select>
  )
}

export function CreatePresetModal({ open, editing, llmModels, ttsVoices, onClose, onSubmit }: CreatePresetModalProps) {
  const { t } = useTranslation('scene')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [llmModelId, setLlmModelId] = useState('__default__')
  const [temperature, setTemperature] = useState('__default__')
  const [temperatureValue, setTemperatureValue] = useState(0.7)
  const [emotionPresetId, setEmotionPresetId] = useState('__default__')
  const [voiceProfileId, setVoiceProfileId] = useState('__default__')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(editing.name)
      setDescription(editing.description ?? '')
      setIcon(editing.icon ?? '')
      setLlmModelId(editing.override_llm_model_id ?? '__default__')
      if (editing.override_temperature !== null && editing.override_temperature !== undefined) {
        setTemperature('custom')
        setTemperatureValue(editing.override_temperature)
      } else {
        setTemperature('__default__')
        setTemperatureValue(0.7)
      }
      setEmotionPresetId(editing.override_emotion_preset_id ?? '__default__')
      setVoiceProfileId(editing.override_voice_profile_id ?? '__default__')
    } else {
      setName('')
      setDescription('')
      setIcon('')
      setLlmModelId('__default__')
      setTemperature('__default__')
      setTemperatureValue(0.7)
      setEmotionPresetId('__default__')
      setVoiceProfileId('__default__')
    }
    setError(null)
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError(t('preset.errorNameRequired')); return }
    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        name:                    name.trim(),
        description:             description.trim() || null,
        icon:                    icon.trim() || null,
        override_llm_model_id:   llmModelId !== '__default__' ? llmModelId : null,
        override_temperature:    temperature === 'custom' ? temperatureValue : null,
        override_emotion_preset_id: emotionPresetId !== '__default__' ? emotionPresetId : null,
        override_voice_profile_id:  voiceProfileId  !== '__default__' ? voiceProfileId  : null,
      })
      onClose()
    } catch {
      setError(editing ? t('preset.errorUpdate') : t('preset.errorCreate'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[10%] z-50 mx-auto w-full max-w-md rounded-[16px] border border-[var(--border-card)] bg-[var(--surface-panel)] p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Title bar */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="home-heading-font text-[16px] font-semibold text-[var(--text-heading)]">
                {editing ? t('preset.editTitle') : t('preset.createTitle')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="grid h-7 w-7 place-items-center rounded-md text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                aria-label={t('preset.close')}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Identity */}
              <div className="flex gap-3">
                <div className="w-20 shrink-0">
                  <FieldLabel>{t('preset.icon')}</FieldLabel>
                  <input
                    type="text"
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    placeholder="🎮"
                    maxLength={8}
                    className="w-full rounded-[8px] border border-[var(--border-card)] bg-[var(--surface-0)] px-3 py-2 text-center text-[18px] outline-none focus:border-[var(--accent-base)] transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <FieldLabel>{t('preset.nameRequired')}</FieldLabel>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('preset.namePlaceholder')}
                    className="w-full rounded-[8px] border border-[var(--border-card)] bg-[var(--surface-0)] px-3 py-2 text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent-base)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>{t('preset.description')}</FieldLabel>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t('preset.descriptionPlaceholder')}
                  className="w-full rounded-[8px] border border-[var(--border-card)] bg-[var(--surface-0)] px-3 py-2 text-body text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent-base)] transition-colors"
                />
              </div>

              {/* Overrides */}
              <div className="rounded-[10px] border border-[var(--border-card)] bg-[var(--surface-0)] p-3">
                <p className="home-ui-font mb-3 text-body font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                  {t('preset.runtimeOverrides')}
                </p>
                <div className="flex flex-col gap-3">
                  {/* LLM Model */}
                  <div>
                    <FieldLabel>{t('preset.llmModel')}</FieldLabel>
                    <Select value={llmModelId} onChange={setLlmModelId}>
                      <option value="__default__">{t('preset.soulDefault')}</option>
                      {llmModels.map(m => (
                        <option key={m.id} value={m.model_id}>{m.display_name}</option>
                      ))}
                    </Select>
                  </div>

                  {/* Temperature */}
                  <div>
                    <FieldLabel>{t('preset.temperature')}</FieldLabel>
                    <Select value={temperature} onChange={setTemperature}>
                      <option value="__default__">{t('preset.soulDefault')}</option>
                      <option value="custom">{t('preset.custom')}</option>
                    </Select>
                    {temperature === 'custom' && (
                      <div className="mt-2 flex items-center gap-3">
                        <Slider
                          value={temperatureValue} onChange={setTemperatureValue}
                          min={0} max={2} step={0.05}
                          fill="var(--text-primary)" trackHeight={3} thumbSize={12}
                          className="flex-1"
                        />
                        <span className="w-8 text-right text-body font-medium text-[var(--text-primary)]">
                          {temperatureValue.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Emotion preset */}
                  <div>
                    <FieldLabel>{t('preset.emotionProfile')}</FieldLabel>
                    <Select value={emotionPresetId} onChange={setEmotionPresetId}>
                      <option value="__default__">{t('preset.soulDefault')}</option>
                      {EMOTION_PRESETS.map(p => (
                        <option key={p.id} value={p.id}>{t(p.labelKey)}</option>
                      ))}
                    </Select>
                  </div>

                  {/* Voice */}
                  <div>
                    <FieldLabel>{t('preset.voiceProfile')}</FieldLabel>
                    <Select value={voiceProfileId} onChange={setVoiceProfileId}>
                      <option value="__default__">{t('preset.soulDefault')}</option>
                      {ttsVoices.map(v => (
                        <option key={v.id} value={v.voice_id}>{v.display_name} ({v.provider})</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-body text-red-400">{error}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-[var(--border-card)] px-4 py-2 text-body text-[var(--text-secondary)] hover:border-[var(--border-divider)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {t('preset.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-md bg-[var(--accent-base)] px-4 py-2 text-body font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {busy ? t('preset.saving') : editing ? t('preset.saveScene') : t('preset.createScene')}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
