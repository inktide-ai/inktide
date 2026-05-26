'use client'

import type { VoiceProviderCatalogEntry } from '@/shared/data/voice-providers'
import { cn } from '@/lib/utils'
import { CredentialStatusBadge, type CredentialStatus } from '@/features/soul/components/credential-status-badge'

export interface VoiceProviderCardProps {
  provider: VoiceProviderCatalogEntry
  selected: boolean
  onSelect: () => void
  credentialStatus?: CredentialStatus
  credentialError?: string | null
}

export function VoiceProviderCard({ provider, selected, onSelect, credentialStatus, credentialError }: VoiceProviderCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-[10px] border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-0)]"
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-[10px] p-3',
          'font-[var(--font-ui)] transition-[background-color,box-shadow] duration-150 ease-out',
          selected
            ? 'bg-[var(--surface-card-hover)] shadow-[inset_0_0_0_1.5px_#3B82F6]'
            : 'bg-[var(--surface-card)] shadow-[inset_0_0_0_1px_var(--border-default)] hover:bg-[var(--surface-card-hover)] hover:shadow-[inset_0_0_0_1px_var(--border-strong)]',
        )}
      >
        <div className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px]',
          provider.darkIcon && 'bg-white p-2',
        )}>
          <img
            src={provider.iconSrc}
            alt={provider.name}
            className={cn('object-contain', provider.darkIcon ? 'h-full w-full' : 'h-11 w-11 rounded-[10px]')}
            draggable={false}
          />
        </div>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium leading-5 text-[var(--text-primary)]">
          {provider.name}
        </span>
        {credentialStatus && (
          <CredentialStatusBadge status={credentialStatus} error={credentialError} />
        )}
      </div>
    </button>
  )
}
