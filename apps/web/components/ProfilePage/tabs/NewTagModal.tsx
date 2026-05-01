'use client'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HexColorPicker } from 'react-colorful'
import { addCustomSceneTag } from '../../../api/soul'
import styles from './SceneTab.module.css'
import colorStyles from './NewTagModal.module.css'

const MAX_LEN = 128

// Preset palette for quick tag color pick
const TAG_COLOR_PRESETS = [
  '#818cf8', '#a78bfa', '#f472b6', '#4ade80',
  '#38bdf8', '#fb923c', '#f87171', '#facc15',
]

interface NewTagModalProps {
  cardId: string
  onClose: () => void
  onCreated: (label: string) => void
}

export function NewTagModal({ cardId, onClose, onCreated }: NewTagModalProps) {
  const { t } = useTranslation('scene')
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(TAG_COLOR_PRESETS[0]!)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = label.trim()
  const canSubmit = trimmed.length > 0 && !submitting

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleCreate() {
    if (!trimmed) {
      setError(t('newTag.errorEmpty'))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await addCustomSceneTag(cardId, trimmed, color)
      onCreated(trimmed)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('newTag.errorGeneric'))
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalBox}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{t('newTag.title')}</span>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label={t('newTag.closeAria')}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Label input */}
          <div>
            <div className={styles.modalFieldLabel}>{t('newTag.label')}</div>
            <input
              className={styles.modalTextInput}
              placeholder={t('newTag.placeholder')}
              value={label}
              onChange={e => setLabel(e.target.value.slice(0, MAX_LEN))}
              maxLength={MAX_LEN}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <div className={styles.modalCharCount}>
              {label.length}/{MAX_LEN} · {t('newTag.maxLength', { max: MAX_LEN })}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <div className={styles.modalFieldLabel}>Цвет тега</div>
            <div className={colorStyles.colorPickerWrap}>
              <HexColorPicker color={color} onChange={setColor} className={colorStyles.picker} />
              <div className={colorStyles.presets}>
                {TAG_COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`${colorStyles.preset} ${color === c ? colorStyles.presetActive : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={c}
                  />
                ))}
              </div>
              {/* Preview swatch */}
              <div className={colorStyles.preview}>
                <span
                  className={colorStyles.previewPill}
                  style={{
                    color,
                    background: `${color}1a`,
                    border: `1px solid ${color}59`,
                  }}
                >
                  {trimmed || 'Тег'}
                </span>
                <span className={colorStyles.previewHex}>{color.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {error && <div className={styles.settingsError}>{error}</div>}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.modalBtnCancel} onClick={onClose} disabled={submitting}>
            {t('newTag.cancel')}
          </button>
          <button type="button" className={styles.modalBtnCreate} disabled={!canSubmit} onClick={handleCreate}>
            {submitting ? t('newTag.creating') : t('newTag.create')}
          </button>
        </div>
      </div>
    </div>
  )
}
