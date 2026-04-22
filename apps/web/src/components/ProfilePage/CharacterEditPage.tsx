import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCard, updateCard, uploadCardAvatar } from '../../api/soul'
import {
  apiResponseToCharacter,
  characterToUpdateRequest,
  type AiCharacter,
} from '../../domain/character'
import { BannerColorPicker } from './BannerColorPicker'
import { getBannerAccent, getBannerStyle } from './bannerPresets'
import { uploadCardBanner, removeCardBanner } from '../../api/soul'
import BannerCropModal from './BannerCropModal'
import styles from './CharacterEditPage.module.css'

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function CharacterEditPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['profile', 'common'])
  const fileRef = useRef<HTMLInputElement>(null)

  const [character, setCharacter] = useState<AiCharacter | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [bannerBusy, setBannerBusy] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const bannerFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!cardId) return
    let cancelled = false
    ;(async () => {
      setLoadError(null)
      try {
        const r = await getCard(cardId)
        if (!cancelled) setCharacter(apiResponseToCharacter(r))
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cardId])

  const patch = useCallback((p: Partial<AiCharacter>) => {
    setCharacter((c) => (c ? { ...c, ...p } : null))
  }, [])

  const onAvatar = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !character || !cardId) return
      if (!file.type.startsWith('image/')) return
      setAvatarBusy(true)
      setSaveError(null)
      try {
        const res = await uploadCardAvatar(cardId, file)
        setCharacter(apiResponseToCharacter(res))
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Avatar upload failed')
      } finally {
        setAvatarBusy(false)
      }
    },
    [cardId, character],
  )

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!character || !cardId) return
      setSaving(true)
      setSaveError(null)
      try {
        const res = await updateCard(cardId, characterToUpdateRequest(character))
        setCharacter(apiResponseToCharacter(res))
        navigate('/profile', { state: { focusCardId: cardId, returnTab: 'profile' } })
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Save failed')
      } finally {
        setSaving(false)
      }
    },
    [cardId, character, navigate],
  )

  const goWorkshop = useCallback(() => {
    if (cardId) navigate('/profile', { state: { focusCardId: cardId, returnTab: 'profile' } })
    else navigate('/profile')
  }, [cardId, navigate])

  const onBannerFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !character || !cardId) return
      if (!file.type.startsWith('image/')) return
      const objectUrl = URL.createObjectURL(file)
      setCropSrc(objectUrl)
    },
    [character, cardId],
  )

  const onCropApply = useCallback(
    async (blob: Blob) => {
      if (!cardId) return
      setCropSrc((src) => { if (src) URL.revokeObjectURL(src); return null })
      setBannerBusy(true)
      setSaveError(null)
      try {
        const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' })
        const res = await uploadCardBanner(cardId, file)
        setCharacter(apiResponseToCharacter(res))
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Banner upload failed')
      } finally {
        setBannerBusy(false)
      }
    },
    [cardId],
  )

  const onCropCancel = useCallback(() => {
    setCropSrc((src) => { if (src) URL.revokeObjectURL(src); return null })
  }, [])

  const onBannerRemove = useCallback(async () => {
    if (!cardId || !character) return
    setBannerBusy(true)
    setSaveError(null)
    try {
      const res = await removeCardBanner(cardId)
      setCharacter(apiResponseToCharacter(res))
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to remove banner')
    } finally {
      setBannerBusy(false)
    }
  }, [cardId, character])

  const initial = character?.name?.charAt(0).toUpperCase() ?? '?'

  if (!cardId) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{t('common:status.invalidLink')}</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.back} onClick={goWorkshop}>
          {t('common:action.back')}
        </button>
        <p className={styles.error}>{loadError}</p>
      </div>
    )
  }

  if (!character) {
    return (
      <div className={styles.page}>
        <div className={styles.spinnerWrap}>
          <div className={styles.spinner} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {cropSrc && (
        <BannerCropModal
          imageSrc={cropSrc}
          onApply={(blob) => void onCropApply(blob)}
          onCancel={onCropCancel}
        />
      )}
      <button type="button" className={styles.back} onClick={goWorkshop}>
        {t('common:action.backToProfile')}
      </button>

      <h1 className={styles.title}>{t('profile:edit.title')}</h1>
      <p className={styles.lead}>{t('profile:edit.lead')}</p>

      <form className={styles.card} onSubmit={onSubmit}>
        {/* ── Banner ── */}
        <div
          className={styles.bannerPreview}
          style={
            character.appearance.bannerImageUrl
              ? { backgroundImage: `url(${character.appearance.bannerImageUrl})` }
              : { background: getBannerStyle(character.appearance.bannerColorIndex, character.appearance.bannerCustomColor) }
          }
        >
          <button
            type="button"
            className={styles.bannerOverlay}
            onClick={() => !bannerBusy && bannerFileRef.current?.click()}
            disabled={bannerBusy}
          >
            <span className={styles.bannerOverlayMain}>
              {bannerBusy ? '…' : t('profile:edit.banner.change')}
            </span>
          </button>

          {character.appearance.bannerImageUrl && (
            <button
              type="button"
              className={styles.bannerRemoveBtn}
              onClick={onBannerRemove}
              disabled={bannerBusy}
            >
              {t('profile:edit.banner.remove')}
            </button>
          )}
        </div>

        <input
          ref={bannerFileRef}
          type="file"
          accept="image/*"
          className={styles.hiddenFile}
          onChange={onBannerFile}
        />

        <div className={styles.cardGrid}>
          <div className={styles.avatarCol}>
            <button
              type="button"
              className={styles.avatarBtn}
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              aria-label={t('profile:edit.avatar.changeAriaLabel')}
            >
              {character.appearance.avatarUrl ? (
                <img src={character.appearance.avatarUrl} alt="" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarFallback}>{initial}</div>
              )}
              <span className={styles.avatarOverlay}>
                {avatarBusy ? '…' : <PencilIcon />}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFile}
              onChange={onAvatar}
            />
            <p className={styles.avatarHint}>{t('profile:edit.avatar.hint')}</p>

            <div className={styles.bannerColorField}>
              <span className={styles.bannerColorLabel}>{t('profile:edit.banner.colorLabel')}</span>
              <BannerColorPicker
                value={character.appearance.bannerCustomColor ?? getBannerAccent(character.appearance.bannerColorIndex)}
                onChange={(color) =>
                  patch({ appearance: { ...character.appearance, bannerCustomColor: color } })
                }
              />
            </div>
          </div>

          <div className={styles.fields}>
            <label className={styles.label} htmlFor="ec-name">
              {t('profile:edit.field.displayName')}
            </label>
            <input
              id="ec-name"
              className={styles.input}
              value={character.name}
              onChange={(e) => patch({ name: e.target.value })}
              required
            />

            <label className={styles.label} htmlFor="ec-slug">
              {t('profile:edit.field.slug')}
            </label>
            <div className={styles.slugRow}>
              <span className={styles.slugPrefix}>/</span>
              <input
                id="ec-slug"
                className={styles.input}
                value={character.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                required
              />
            </div>

            <label className={styles.label} htmlFor="ec-lang">
              {t('profile:edit.field.language')}
            </label>
            <input
              id="ec-lang"
              className={styles.input}
              value={character.behavior.language}
              onChange={(e) => patch({ behavior: { ...character.behavior, language: e.target.value } })}
              placeholder="en"
            />

            <label className={styles.label} htmlFor="ec-phrases">
              {t('profile:edit.field.keyPhrases')}
            </label>
            <input
              id="ec-phrases"
              className={styles.input}
              value={character.appearance.keyPhrases}
              onChange={(e) => patch({ appearance: { ...character.appearance, keyPhrases: e.target.value } })}
              placeholder={t('profile:edit.field.keyPhrasesPlaceholder')}
            />

            <label className={styles.label} htmlFor="ec-personality">
              {t('profile:edit.field.personality')}
            </label>
            <textarea
              id="ec-personality"
              className={styles.textarea}
              value={character.personality}
              onChange={(e) => patch({ personality: e.target.value })}
              rows={6}
              placeholder={t('profile:edit.field.personalityPlaceholder')}
            />
          </div>
        </div>

        {saveError && (
          <p className={styles.formError} role="alert">
            {saveError}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={goWorkshop}>
            {t('common:action.cancel')}
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? t('common:action.saving') : t('common:action.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
