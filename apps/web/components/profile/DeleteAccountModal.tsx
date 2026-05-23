import { cn } from '@/lib/utils'

interface DeleteAccountModalProps {
  isDeleting: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteAccountModal({
  isDeleting,
  error,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-[rgba(5,5,9,0.75)] backdrop-blur-[6px] animate-[menuIn_0.2s_ease]"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] p-6 rounded-2xl bg-[var(--bg-surface)] border border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-account-title" className="m-0 mb-3 text-[1.125rem] font-semibold text-[var(--text-primary)]">
          Delete account
        </h2>
        <p className="m-0 mb-5 text-[0.875rem] leading-[1.5] text-[var(--text-secondary)]">
          This removes your characters and related data from Inktide. If the server is configured
          for it, your login identity is removed from Keycloak as well.
        </p>
        {error && (
          <p
            className="m-0 mb-4 px-3 py-[0.625rem] rounded-lg text-[0.8125rem] leading-[1.45] text-[#ffc9c9] bg-[rgba(237,62,62,0.12)] border border-[rgba(237,62,62,0.35)]"
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="flex gap-3 justify-end flex-wrap">
          <button
            type="button"
            className={cn(
              'px-4 py-2 rounded-[10px] border border-white/15 bg-transparent text-[var(--text-primary)]',
              'font-[var(--font-ui)] text-[0.875rem] font-medium cursor-pointer transition-[background] duration-150',
              'hover:bg-white/[0.06] disabled:opacity-65 disabled:cursor-not-allowed',
            )}
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(
              'px-4 py-2 rounded-[10px] border-none text-white',
              'font-[var(--font-ui)] text-[0.875rem] font-semibold cursor-pointer',
              'bg-gradient-to-br from-[var(--accent-red)] to-[var(--accent-red-bright)]',
              'shadow-[0_0_16px_rgba(237,62,62,0.35)] transition-[transform,box-shadow] duration-150',
              'hover:enabled:-translate-y-px hover:enabled:shadow-[0_0_24px_rgba(237,62,62,0.45)]',
              'disabled:opacity-65 disabled:cursor-not-allowed disabled:translate-y-0',
            )}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}
