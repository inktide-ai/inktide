'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import UserAccountSettings, { type PageId } from './user-account-settings'

interface Props {
  open: boolean
  onClose: () => void
  initialPage?: PageId
}

export default function AccountSettingsModal({ open, onClose, initialPage }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !open) return null

  return (
    <Dialog.Root open onOpenChange={(next) => { if (!next) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[2000] data-[state=open]:animate-[accountModalBackdropIn_0.16s_cubic-bezier(0.2,0.9,0.2,1)]"
          style={{ background: 'var(--surface-overlay)' }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[2000] flex max-h-[92vh] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] data-[state=open]:animate-[accountModalIn_0.18s_cubic-bezier(0.2,0.9,0.2,1)]"
          style={{
            width: 'min(1024px, 96vw)',
            height: 'min(680px, 92vh)',
            background: 'var(--menu-panel-bg)',
            boxShadow: 'var(--menu-panel-shadow)',
          }}
        >
          <Dialog.Title className="sr-only">Account settings</Dialog.Title>
          <Dialog.Description className="sr-only">Manage your account and workspace preferences</Dialog.Description>
          <UserAccountSettings initialPage={initialPage} onClose={onClose} />

          <Dialog.Close
            type="button"
            aria-label="Close"
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>

      <style>{`
        @keyframes accountModalBackdropIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes accountModalIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 8px)) scale(0.98) }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1) }
        }
      `}</style>
    </Dialog.Root>
  )
}
