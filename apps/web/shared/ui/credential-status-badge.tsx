export type CredentialStatus = 'untested' | 'verified' | 'failed' | 'testing'

interface CredentialStatusBadgeProps {
  status: CredentialStatus
  error?: string | null
  className?: string
}

export function CredentialStatusBadge({ status, error, className }: CredentialStatusBadgeProps) {
  if (status === 'untested') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium
          bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.35)] ${className ?? ''}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.25)]" />
        Untested
      </span>
    )
  }

  if (status === 'testing') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium
          bg-[rgba(99,102,241,0.12)] text-[#818cf8] ${className ?? ''}`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#818cf8]" />
        Testing…
      </span>
    )
  }

  if (status === 'verified') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium
          bg-[var(--color-online)]/10 text-[var(--color-online)] ${className ?? ''}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-online)]" />
        Verified
      </span>
    )
  }

  // failed
  return (
    <span
      className={`inline-flex flex-col gap-0.5 rounded-md px-2 py-1 text-xs font-medium
        bg-[var(--color-error-mid)]/10 border border-[var(--color-error-mid)]/20 text-[var(--color-error-mid)] ${className ?? ''}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-error-strong)]" />
        Invalid key
      </span>
      {error && (
        <span className="pl-3 text-[0.7rem] text-[rgba(248,113,113,0.75)] leading-tight">{error}</span>
      )}
    </span>
  )
}

export function statusFromCredential(
  verifiedAt: string | null | undefined,
  lastError: string | null | undefined,
): CredentialStatus {
  if (lastError) return 'failed'
  if (verifiedAt) return 'verified'
  return 'untested'
}
