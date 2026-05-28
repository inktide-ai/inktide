'use client'
import { useState } from 'react'

interface DeleteAccountModalProps {
  userEmail: string | null
  isDeleting: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteAccountModal({
  userEmail,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [typed, setTyped] = useState('')

  const confirmed = userEmail
    ? typed.trim().toLowerCase() === userEmail.toLowerCase()
    : typed.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-[rgba(5,5,9,0.75)] backdrop-blur-[6px] animate-[menuIn_0.2s_ease]"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] p-6 rounded-2xl bg-(--bg-surface) border border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-account-title" className="m-0 mb-3 text-[1.125rem] font-semibold text-(--text-primary)">
          Delete account
        </h2>
        <p className="m-0 mb-4 text-body leading-relaxed text-(--text-muted)">
          This removes your characters and related data from Inktide. If the server is configured
          for it, your login identity is removed from Keycloak as well.
        </p>

        <label className="block mb-1 text-sm font-medium text-(--text-secondary)">
          {userEmail
            ? <>Type <span className="font-semibold text-(--text-primary)">{userEmail}</span> to confirm</>
            : 'Type anything to confirm'}
        </label>
        <input
          type="email"
          autoComplete="off"
          spellCheck={false}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={isDeleting}
          placeholder={userEmail ?? 'your email'}
          className="mb-4 w-full rounded-[8px] border border-white/15 bg-white/[0.04] px-3 py-[9px] text-body text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-[rgba(237,62,62,0.6)] transition-colors disabled:opacity-65"
        />

        {error && (
          <p className="m-0 mb-4 py-[0.625rem] px-3 rounded-[8px] text-sm leading-[1.45] text-[#ffc9c9] bg-[rgba(237,62,62,0.12)] border border-[rgba(237,62,62,0.35)]" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-3 justify-end flex-wrap">
          <button
            type="button"
            className="py-2 px-4 rounded-[10px] border border-white/15 bg-transparent text-(--text-primary) font-[var(--font-ui)] text-body font-medium cursor-pointer transition-[background] duration-150 ease hover:bg-white/[0.06] disabled:opacity-65 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="py-2 px-4 rounded-[10px] border-none bg-[linear-gradient(135deg,var(--accent-red)_0%,var(--accent-red-bright)_100%)] text-white font-[var(--font-ui)] text-body font-semibold cursor-pointer shadow-[0_0_16px_rgba(237,62,62,0.35)] transition-[transform,box-shadow] duration-150 ease hover:enabled:-translate-y-px hover:enabled:shadow-[0_0_24px_rgba(237,62,62,0.45)] disabled:opacity-65 disabled:cursor-not-allowed disabled:translate-y-0"
            onClick={onConfirm}
            disabled={isDeleting || !confirmed}
          >
            {isDeleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}
