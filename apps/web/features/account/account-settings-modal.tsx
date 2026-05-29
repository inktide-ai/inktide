'use client'

import { useTranslation } from 'react-i18next'
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/shared/ui/dialog'
import UserAccountSettings, { type PageId } from './user-account-settings'

interface Props {
  open: boolean
  onClose: () => void
  initialPage?: PageId
}

export default function AccountSettingsModal({ open, onClose, initialPage }: Props) {
  const { t } = useTranslation('account')
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogPortal>
        <DialogOverlay
          className="fixed inset-0 z-[2000] bg-[var(--surface-overlay)] data-[state=open]:animate-[accountModalBackdropIn_0.16s_cubic-bezier(0.2,0.9,0.2,1)_0s_1_normal_backwards]"
        />
        <DialogContent
          className="fixed left-1/2 top-1/2 z-[2000] flex w-[min(1024px,96vw)] h-[min(680px,92vh)] max-h-[92vh] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] bg-[var(--menu-panel-bg)] shadow-[var(--menu-panel-shadow)] data-[state=open]:animate-[accountModalIn_0.18s_cubic-bezier(0.2,0.9,0.2,1)_0s_1_normal_backwards]"
        >
          <DialogTitle className="sr-only">{t('modal.title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('modal.desc')}</DialogDescription>
          <UserAccountSettings initialPage={initialPage} onClose={onClose} />

          <DialogClose
            type="button"
            aria-label={t('modal.close')}
            className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </DialogClose>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
