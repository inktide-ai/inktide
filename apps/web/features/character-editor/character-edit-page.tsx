'use client'
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { SANDBOX_ROUTE } from '@/lib/routes'
import { getCard, updateCard, uploadCardAvatar } from '@/features/soul/api/index' // fsd:cross-feature-ok — soul editor
import {
  apiResponseToCharacter,
  characterToUpdateRequest,
  type AiCharacter,
} from '@/shared/lib/character'
import { BannerColorPicker } from './banner-color-picker'
import { getBannerAccent, getBannerStyle } from '@/shared/ui/banner-presets'
import { uploadCardBanner, removeCardBanner } from '@/features/soul/api/index' // fsd:cross-feature-ok — soul editor
import BannerCropModal from './banner-crop-modal'

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

const inputCls = 'w-full py-[0.55rem] px-3 rounded-lg border border-white/10 bg-black/[0.28] text-(--text-primary) font-[var(--font-ui)] text-body outline-none focus:border-[rgba(237,62,62,0.4)] focus:shadow-[0_0_0_2px_rgba(237,62,62,0.1)]'

export default function CharacterEditPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const router = useRouter()
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
    return () => { cancelled = true }
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
        router.push(SANDBOX_ROUTE)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Save failed')
      } finally {
        setSaving(false)
      }
    },
    [cardId, character, router],
  )

  const goWorkshop = useCallback(() => {
    if (cardId) router.push(SANDBOX_ROUTE)
    else router.push(SANDBOX_ROUTE)
  }, [cardId, router])

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

  const pageCls = 'min-h-screen bg-(--bg-dark) py-8 px-10 max-w-[720px] mx-auto'
  const backCls = 'inline-flex items-center gap-[0.35rem] mb-5 py-[0.35rem] px-2 -ml-2 border-none bg-transparent text-(--text-muted) font-[var(--font-ui)] text-body font-medium cursor-pointer rounded-[0.375rem] transition-[color,background] duration-150 ease hover:text-(--text-primary) hover:bg-white/[0.05]'

  if (!cardId) {
    return (
      <div className={pageCls}>
        <p className="text-[var(--color-error-mid)]">{t('common:status.invalidLink')}</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={pageCls}>
        <button type="button" className={backCls} onClick={goWorkshop}>
          {t('common:action.back')}
        </button>
        <p className="text-[var(--color-error-mid)]">{loadError}</p>
      </div>
    )
  }

  if (!character) {
    return (
      <div className={pageCls}>
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-[3px] border-white/10 border-t-(--accent-red) rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className={pageCls}>
      {cropSrc && (
        <BannerCropModal
          imageSrc={cropSrc}
          onApply={(blob) => void onCropApply(blob)}
          onCancel={onCropCancel}
        />
      )}
      <button type="button" className={backCls} onClick={goWorkshop}>
        {t('common:action.backToProfile')}
      </button>

      <h1 className="text-[1.5rem] font-bold tracking-[-0.02em] m-0 mb-2 text-(--text-primary)">
        {t('profile:edit.title')}
      </h1>
      <p className="m-0 mb-6 text-body leading-relaxed text-(--text-muted)">
        {t('profile:edit.lead')}
      </p>

      <form
        className="rounded-2xl overflow-hidden bg-(--bg-surface) border border-(--border) shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
        onSubmit={onSubmit}
      >
        <div
          className="group relative h-[110px] bg-cover bg-center bg-no-repeat cursor-pointer"
          style={
            character.appearance.bannerImageUrl
              ? { backgroundImage: `url(${character.appearance.bannerImageUrl})` }
              : { background: getBannerStyle(character.appearance.bannerColorIndex, character.appearance.bannerCustomColor) }
          }
        >
          <button
            type="button"
            className="absolute inset-0 flex flex-col items-center justify-center bg-transparent border-none cursor-pointer transition-[background] duration-200 ease p-0 w-full group-hover:bg-black/45"
            onClick={() => !bannerBusy && bannerFileRef.current?.click()}
            disabled={bannerBusy}
          >
            <span className="font-[var(--font-ui)] text-body-md font-semibold text-white opacity-0 transition-opacity duration-200 ease tracking-[0.01em] [text-shadow:0_1px_4px_rgba(0,0,0,0.6)] group-hover:opacity-100">
              {bannerBusy ? '…' : t('profile:edit.banner.change')}
            </span>
          </button>

          {character.appearance.bannerImageUrl && (
            <button
              type="button"
              className="absolute bottom-[0.625rem] right-3 border-none bg-black/55 text-white/65 font-[var(--font-ui)] text-xs font-medium py-1 px-[0.625rem] rounded-[6px] cursor-pointer opacity-0 transition-[opacity,color] duration-200 ease backdrop-blur-[4px] group-hover:opacity-100 hover:text-[var(--color-error-mid)]"
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
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
          onChange={onBannerFile}
        />

        <div className="grid grid-cols-[160px_1fr] gap-7 items-start p-6 max-[640px]:grid-cols-1 max-[640px]:justify-items-center">
          {/* Avatar column */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="group relative w-[132px] h-[132px] p-0 border-none rounded-full cursor-pointer overflow-hidden shrink-0 bg-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_12px_36px_rgba(0,0,0,0.35)] disabled:opacity-70 disabled:cursor-wait"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              aria-label={t('profile:edit.avatar.changeAriaLabel')}
            >
              {character.appearance.avatarUrl ? (
                <img src={character.appearance.avatarUrl} alt="" className="w-full h-full object-cover block" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[2.75rem] font-bold text-white bg-[linear-gradient(135deg,var(--accent-red),#8b5cf6)]">
                  {initial}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity duration-[180ms] ease text-xs font-semibold group-hover:opacity-100">
                {avatarBusy ? '…' : <PencilIcon />}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
              onChange={onAvatar}
            />
            <p className="m-0 text-xs text-(--text-muted) text-center max-w-[200px] leading-[1.4]">
              {t('profile:edit.avatar.hint')}
            </p>

            <div className="flex flex-col items-center gap-2 mt-2">
              <span className="text-sm font-semibold text-(--text-primary)">
                {t('profile:edit.banner.colorLabel')}
              </span>
              <BannerColorPicker
                value={character.appearance.bannerCustomColor ?? getBannerAccent(character.appearance.bannerColorIndex)}
                onChange={(color) =>
                  patch({ appearance: { ...character.appearance, bannerCustomColor: color } })
                }
              />
            </div>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-[0.35rem] min-w-0 max-[640px]:w-full">
            <label className="text-sm font-semibold text-(--text-primary) mt-0" htmlFor="ec-name">
              {t('profile:edit.field.displayName')}
            </label>
            <input
              id="ec-name"
              className={inputCls}
              value={character.name}
              onChange={(e) => patch({ name: e.target.value })}
              required
            />

            <label className="text-sm font-semibold text-(--text-primary) mt-2" htmlFor="ec-slug">
              {t('profile:edit.field.slug')}
            </label>
            <div className="flex items-center gap-1">
              <span className="text-(--text-muted) font-mono text-body">/</span>
              <input
                id="ec-slug"
                className={inputCls}
                value={character.slug}
                onChange={(e) => patch({ slug: e.target.value })}
                required
              />
            </div>

            <label className="text-sm font-semibold text-(--text-primary) mt-2" htmlFor="ec-lang">
              {t('profile:edit.field.language')}
            </label>
            <input
              id="ec-lang"
              className={inputCls}
              value={character.behavior.language}
              onChange={(e) => patch({ behavior: { ...character.behavior, language: e.target.value } })}
              placeholder="en"
            />

            <label className="text-sm font-semibold text-(--text-primary) mt-2" htmlFor="ec-phrases">
              {t('profile:edit.field.keyPhrases')}
            </label>
            <input
              id="ec-phrases"
              className={inputCls}
              value={character.appearance.keyPhrases.join(', ')}
              onChange={(e) => patch({ appearance: { ...character.appearance, keyPhrases: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })}
              placeholder={t('profile:edit.field.keyPhrasesPlaceholder')}
            />

            <label className="text-sm font-semibold text-(--text-primary) mt-2" htmlFor="ec-personality">
              {t('profile:edit.field.personality')}
            </label>
            <textarea
              id="ec-personality"
              className={`${inputCls} resize-y min-h-[120px] leading-[1.45]`}
              value={character.personality}
              onChange={(e) => patch({ personality: e.target.value })}
              rows={6}
              placeholder={t('profile:edit.field.personalityPlaceholder')}
            />
          </div>
        </div>

        {saveError && (
          <p className="mx-6 mt-4 mb-0 text-body text-[var(--color-error-mid)]" role="alert">
            {saveError}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-6 px-6 py-5 pb-6 border-t border-(--border)">
          <button
            type="button"
            className="py-[0.55rem] px-4 rounded-lg border border-(--border) bg-transparent text-(--text-muted) font-[var(--font-ui)] text-body font-medium cursor-pointer hover:text-(--text-primary) hover:border-white/[0.12]"
            onClick={goWorkshop}
          >
            {t('common:action.cancel')}
          </button>
          <button
            type="submit"
            className="py-[0.55rem] px-5 rounded-lg border-none bg-[var(--color-error-strong)] text-white font-[var(--font-ui)] text-body font-semibold cursor-pointer transition-[background] duration-200 ease hover:enabled:bg-[#FF5252] disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? t('common:action.saving') : t('common:action.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
