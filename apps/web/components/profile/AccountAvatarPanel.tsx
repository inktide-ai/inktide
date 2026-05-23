'use client'
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStorageStatus, patchAvatar, uploadProfileFile } from '../../api/me'
import type { AiCardListItem } from '../../api/soul'
import { MAX_NICKNAME_LEN } from '../../utils/profileStorage'
import { getBannerAccent, getBannerGradient } from './bannerPresets'
import type { AiCharacter } from '@/lib/character'
import { cn } from '@/lib/utils'

function getInitialLetter(userName: string | undefined): string {
  const u = userName?.trim() ?? ''
  if (!u) return '?'
  const ch = u.replace(/^\./, '').charAt(0)
  return ch ? ch.toUpperCase() : '?'
}

function truncateText(s: string, max: number): string {
  const t = s.trim()
  if (!t.length) return ''
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export interface AccountAvatarPanelProps {
  onBack: () => void
  projects: AiCardListItem[]
  characters: Map<string, AiCharacter>
  onSelectProject: (id: string) => void
}

export default function AccountAvatarPanel({
  onBack,
  projects,
  characters,
  onSelectProject,
}: AccountAvatarPanelProps) {
  const { user, refreshSession, setNickname } = useAuth()
  const [storageEnabled, setStorageEnabled] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [nickDraft, setNickDraft] = useState('')
  const [nickSaved, setNickSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setNickDraft(user?.nickname ?? '')
  }, [user?.userId, user?.nickname])

  useEffect(() => {
    let cancelled = false
    getStorageStatus()
      .then((s) => {
        if (!cancelled) setStorageEnabled(s.enabled)
      })
      .catch(() => {
        if (!cancelled) setStorageEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const displayUrl = localPreview ?? user?.pictureUrl ?? null
  const initial = getInitialLetter(user?.nickname ?? user?.userName)

  const saveNickname = useCallback(() => {
    setNickname(nickDraft)
    setNickSaved(true)
    window.setTimeout(() => setNickSaved(false), 2000)
  }, [nickDraft, setNickname])

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setError(null)
      if (!file.type.startsWith('image/')) {
        setError('Please choose an image file.')
        return
      }
      const blobUrl = URL.createObjectURL(file)
      setLocalPreview(blobUrl)
      setBusy(true)
      try {
        const { key } = await uploadProfileFile(file)
        await patchAvatar(key)
        await refreshSession()
        setLocalPreview(null)
      } catch (err) {
        setLocalPreview(null)
        setError(err instanceof Error ? err.message : 'Could not update avatar')
      } finally {
        URL.revokeObjectURL(blobUrl)
        setBusy(false)
      }
    },
    [refreshSession],
  )

  return (
    <div className="w-full max-w-[1080px] mx-auto pb-10">
      <button
        type="button"
        className="inline-flex items-center gap-[0.35rem] mb-5 py-[0.35rem] px-2 -ml-2 border-none bg-transparent text-[var(--text-muted)] font-[var(--font-ui)] text-[0.875rem] font-medium cursor-pointer rounded-[0.375rem] transition-[color,background] duration-150 hover:text-[var(--text-primary)] hover:bg-white/[0.05]"
        onClick={onBack}
      >
        ← Back to workshop
      </button>

      <section
        className="rounded-[16px] p-6 pb-[1.625rem] bg-gradient-to-br from-[rgba(36,40,52,0.95)] to-[rgba(22,24,30,0.98)] border border-white/[0.08] shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_16px_48px_rgba(0,0,0,0.35)] mb-8"
        aria-labelledby="account-profile-title"
      >
        <header className="mb-5 pb-4 border-b border-white/[0.06]">
          <h1 id="account-profile-title" className="text-[1.375rem] font-bold tracking-[-0.02em] mt-0 mb-[0.375rem] text-[var(--text-primary)]">
            Your profile
          </h1>
          <p className="m-0 text-[0.875rem] leading-[1.5] text-[var(--text-muted)] max-w-[52ch]">
            Account identity: display name and photo. Bots are configured separately — see Projects below.
          </p>
        </header>

        <div className="grid grid-cols-[minmax(0,200px)_minmax(0,1fr)] gap-x-8 gap-y-7 items-start max-[720px]:grid-cols-1 max-[720px]:justify-items-center max-[720px]:text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-[132px] h-[132px] rounded-full overflow-hidden shrink-0 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_12px_36px_rgba(0,0,0,0.4)]">
              {displayUrl ? (
                <img src={displayUrl} alt="" className="w-full h-full object-cover block" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[2.75rem] font-bold text-white bg-gradient-to-br from-[var(--accent-red)] to-[#8b5cf6]" aria-hidden>
                  {initial}
                </div>
              )}
              {busy && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white text-[0.8125rem] font-semibold tracking-[0.02em]">
                  Updating…
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
              onChange={onFileChange}
              disabled={busy || storageEnabled === false}
            />

            <button
              type="button"
              className="py-[0.55rem] px-[1.1rem] border-none rounded-lg bg-gradient-to-br from-[var(--accent-red)] to-[#c026d3] text-white font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-[opacity,transform] duration-150 w-full max-w-[220px] hover:enabled:opacity-[0.95] disabled:opacity-45 disabled:cursor-not-allowed"
              disabled={busy || storageEnabled === false}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? 'Working…' : 'Upload new photo'}
            </button>
            <p className="m-0 text-[0.75rem] text-[var(--text-muted)] leading-[1.4] text-center max-w-[220px]">PNG, JPG, WebP — up to ~50 MB.</p>
          </div>

          <div className="min-w-0 max-[720px]:w-full max-[720px]:text-left">
            <div className="mb-1">
              <label className="block text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-[0.35rem]" htmlFor="profile-display-name-input">
                Display name
              </label>
              <p className="m-0 mb-3 text-[0.8125rem] leading-[1.45] text-[var(--text-muted)]">
                Shown in the sidebar instead of your login handle. Stored in this browser until Keycloak stores it.
              </p>
              <div className="flex flex-wrap gap-2 items-center max-[720px]:flex-col max-[720px]:items-stretch">
                <input
                  id="profile-display-name-input"
                  className="flex-1 min-w-[160px] py-[0.55rem] px-[0.85rem] rounded-lg border border-white/10 bg-black/[0.28] text-[var(--text-primary)] font-[var(--font-ui)] text-[0.875rem] outline-none focus:border-[rgba(236,72,153,0.45)] focus:shadow-[0_0_0_2px_rgba(236,72,153,0.12)] disabled:opacity-60"
                  type="text"
                  maxLength={MAX_NICKNAME_LEN}
                  value={nickDraft}
                  onChange={(e) => setNickDraft(e.target.value)}
                  placeholder={user?.userName ?? 'Nickname'}
                  disabled={busy}
                  autoComplete="nickname"
                />
                <button
                  type="button"
                  className="py-[0.55rem] px-[1.1rem] rounded-lg border-none bg-white/10 text-[var(--text-primary)] font-[var(--font-ui)] text-[0.875rem] font-semibold cursor-pointer transition-[background] duration-150 shrink-0 hover:enabled:bg-white/[0.14] disabled:opacity-50 disabled:cursor-not-allowed max-[720px]:w-full"
                  onClick={saveNickname}
                  disabled={busy}
                >
                  Save
                </button>
              </div>
              {nickSaved && (
                <p className="mt-2 text-[0.8125rem] text-[#34d399]" role="status">
                  Saved
                </p>
              )}
            </div>

            {storageEnabled === false && (
              <div className="mt-3 px-4 py-3 rounded-lg bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.32)] text-[#fcd34d] text-[0.8125rem] leading-[1.4]" role="status">
                File storage is not configured on the server — avatar upload is unavailable.
              </div>
            )}

            {error && (
              <p className="mt-3 text-[0.875rem] text-[#f87171]" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-1" aria-labelledby="projects-heading">
        <div className="flex items-start gap-3 mb-5">
          <span className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[rgba(139,92,246,0.15)] text-[#c4b5fd] shrink-0" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor" opacity="0.9" />
              <path d="M19 14L19.8 17.2L23 18L19.8 18.8L19 22L18.2 18.8L15 18L18.2 17.2L19 14Z" fill="currentColor" opacity="0.55" />
            </svg>
          </span>
          <div>
            <h2 id="projects-heading" className="m-0 mb-1 text-[1.125rem] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              Projects
            </h2>
            <p className="m-0 text-[0.8125rem] leading-[1.45] text-[var(--text-muted)] max-w-[60ch]">
              Each project is a bot — identity, skills, voice, and model. Open one to edit in the workshop.
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="py-8 px-6 rounded-[14px] border border-dashed border-white/[0.12] bg-black/20 text-center">
            <p className="m-0 text-[var(--text-muted)] text-[0.9375rem]">No projects yet.</p>
            <p className="m-0 mt-2 text-[0.8125rem] text-[var(--text-muted)]">
              Use <strong>Create new</strong> in the sidebar to add your first bot.
            </p>
          </div>
        ) : (
          <ul className="list-none m-0 p-0 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {projects.map((c) => {
              const char = characters.get(c.id)
              const bannerIdx = char?.appearance.bannerColorIndex ?? 0
              const accent = getBannerAccent(bannerIdx)
              const desc = truncateText(c.personality, 140)
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex gap-4 w-full py-[1.1rem] px-[1.15rem] text-left',
                      'border border-white/[0.07] rounded-[12px] bg-[rgba(28,31,38,0.85)]',
                      'cursor-pointer font-[inherit] text-inherit',
                      'transition-[border-color,box-shadow,transform,background] duration-200',
                      'hover:border-white/[0.14] hover:bg-[rgba(34,38,48,0.95)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:-translate-y-0.5',
                      'focus-visible:outline-none focus-visible:border-[rgba(236,72,153,0.45)] focus-visible:shadow-[0_0_0_2px_rgba(236,72,153,0.2)]',
                      'motion-reduce:transition-[border-color,box-shadow,background] motion-reduce:hover:translate-y-0',
                    )}
                    onClick={() => onSelectProject(c.id)}
                  >
                    <div className="relative w-12 h-12 shrink-0">
                      <div
                        className="w-full h-full rounded-[10px] overflow-hidden flex items-center justify-center"
                        style={c.avatar_url ? undefined : { background: getBannerGradient(bannerIdx) }}
                      >
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt="" className="w-full h-full object-cover block" />
                        ) : (
                          <span className="text-[1.25rem] font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">{c.name.charAt(0)}</span>
                        )}
                      </div>
                      {c.is_active && (
                        <span className="absolute -right-px -bottom-px w-[10px] h-[10px] rounded-full bg-[#22c55e] shadow-[0_0_0_2px_rgba(22,24,30,0.95)] z-[1] pointer-events-none" title="Active" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-[0.2rem]">
                        <h3 className="m-0 text-[0.9375rem] font-semibold text-[var(--text-primary)] leading-[1.3] break-words">{c.name}</h3>
                        <span
                          className="shrink-0 text-[0.625rem] font-bold tracking-[0.06em] uppercase py-[0.2rem] px-[0.45rem] rounded-[4px]"
                          style={{ background: `${accent}22`, color: accent }}
                        >
                          Bot
                        </span>
                      </div>
                      <p className="m-0 mb-[0.35rem] text-[0.75rem] text-[var(--text-muted)] font-[ui-monospace,monospace]">/{c.slug}</p>
                      {desc ? (
                        <p className="m-0 text-[0.8125rem] leading-[1.45] text-[rgba(200,204,214,0.88)] line-clamp-3">{desc}</p>
                      ) : (
                        <p className="m-0 text-[0.8125rem] italic text-[var(--text-muted)] opacity-85">No description yet</p>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
