'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { AiCharacter } from '@/shared/lib/character'

interface AccountManagementProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  onDelete?: () => void
}

export function AccountManagement({ character, onUpdate, onDelete }: AccountManagementProps) {
  const { t } = useTranslation(['profile', 'common'])
  const [deactivateConfirm, setDeactivateConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  return (
    <div className="flex flex-col gap-3 border-t border-(--border) pt-4 mt-6">
      <div className="text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2">{t('identity.accountManagement')}</div>
      <div className="bg-transparent border-none overflow-visible">
        <div className="flex items-center justify-between gap-6 px-6 py-5 flex-wrap">
          <div>
            <div className="text-[0.9375rem] font-bold text-(--text-primary) mb-1">
              {character.isActive ? t('identity.deactivate') : t('identity.activate')}
            </div>
            <div className="text-[0.8125rem] text-(--text-muted) leading-relaxed max-w-[400px]">
              {character.isActive ? t('identity.deactivateDesc') : t('identity.activateDesc')}
            </div>
          </div>
          {deactivateConfirm ? (
            <div className="flex items-center gap-[0.625rem] flex-wrap">
              <span className="text-[0.8125rem] text-(--text-muted) whitespace-nowrap">{t('identity.areYouSure')}</span>
              <button
                type="button"
                className="px-[1.125rem] py-2 bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.3)] rounded-lg text-[#fbbf24] font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 ease whitespace-nowrap hover:bg-[rgba(251,191,36,0.2)]"
                onClick={() => {
                  onUpdate({ isActive: !character.isActive })
                  setDeactivateConfirm(false)
                }}
              >
                {character.isActive ? t('identity.deactivateBtn') : t('identity.activateBtn')}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-transparent border border-(--border) rounded-lg text-(--text-muted) font-[var(--font-ui)] text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 ease whitespace-nowrap hover:bg-white/[0.04] hover:text-(--text-primary)"
                onClick={() => setDeactivateConfirm(false)}
              >
                {t('common:action.cancel')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={cn(
                'px-[1.125rem] py-2 rounded-lg font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 ease whitespace-nowrap',
                character.isActive
                  ? 'bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.3)] text-[#fbbf24] hover:bg-[rgba(251,191,36,0.2)]'
                  : 'bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.3)] text-[#4ade80] hover:bg-[rgba(34,197,94,0.2)]',
              )}
              onClick={() => setDeactivateConfirm(true)}
            >
              {character.isActive ? t('identity.deactivateBtn') : t('identity.activateBtn')}
            </button>
          )}
        </div>

        <div className="h-px bg-[rgba(237,62,62,0.12)] mx-6" />

        <div className="flex items-center justify-between gap-6 px-6 py-5 flex-wrap">
          <div>
            <div className="text-[0.9375rem] font-bold text-(--text-primary) mb-1">{t('identity.deleteCharacter')}</div>
            <div className="text-[0.8125rem] text-(--text-muted) leading-relaxed max-w-[400px]">{t('identity.deleteDesc')}</div>
          </div>
          {deleteConfirm ? (
            <div className="flex items-center gap-[0.625rem] flex-wrap">
              <span className="text-[0.8125rem] text-(--text-muted) whitespace-nowrap">{t('identity.isPermanent')}</span>
              <button
                type="button"
                className="px-[1.125rem] py-2 bg-[rgba(237,62,62,0.15)] border border-[rgba(237,62,62,0.4)] rounded-lg text-(--accent-red-bright) font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 ease whitespace-nowrap hover:bg-[rgba(237,62,62,0.25)]"
                onClick={() => {
                  onDelete?.()
                  setDeleteConfirm(false)
                }}
              >
                {t('identity.deleteForever')}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-transparent border border-(--border) rounded-lg text-(--text-muted) font-[var(--font-ui)] text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 ease whitespace-nowrap hover:bg-white/[0.04] hover:text-(--text-primary)"
                onClick={() => setDeleteConfirm(false)}
              >
                {t('common:action.cancel')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="px-[1.125rem] py-2 bg-transparent border border-[rgba(237,62,62,0.3)] rounded-lg text-(--accent-red) font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 ease whitespace-nowrap hover:bg-[rgba(237,62,62,0.08)] hover:border-[rgba(237,62,62,0.5)]"
              onClick={() => setDeleteConfirm(true)}
            >
              {t('identity.deleteCharacter')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
