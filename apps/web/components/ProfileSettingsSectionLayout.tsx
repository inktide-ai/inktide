'use client'

import { type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useCharactersContext } from '@/context/CharactersContext'
import { PROFILE_SETTINGS_BASE } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

const SEGMENT_TO_TAB: Record<string, string> = {
  identity: 'profile',
  skills: 'skills',
  model: 'avatars',
  scene: 'scene',
  memory: 'memory',
  brain: 'brain',
  voice: 'voice',
  integrations: 'connection',
  obs: 'obs',
  backup: 'backup',
}

function settingsTitleKey(segment: string): string {
  if (segment === 'account') return 'common:sidebar.profile'
  const tab = SEGMENT_TO_TAB[segment]
  return tab ? `profile:tabs.${tab}.label` : segment
}

interface Props {
  children: ReactNode
}

export default function ProfileSettingsSectionLayout({ children }: Props) {
  const { t } = useTranslation(['common', 'profile'])
  const router = useRouter()
  const pathname = usePathname()
  const { selected, isDirty, saveStatus, saveError, discardChanges, handleSave } = useCharactersContext()

  const segment = pathname.replace(`${PROFILE_SETTINGS_BASE}/`, '').split('/')[0] ?? ''

  if (!selected) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] -ml-2"
          onClick={() => router.push(PROFILE_SETTINGS_BASE)}
        >
          <ChevronLeft className="w-4 h-4" />
          {t('common:emptyState.backToSections')}
        </Button>

        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          selected.isActive
            ? 'bg-green-500/10 text-green-400'
            : 'bg-white/5 text-[var(--text-muted)]',
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', selected.isActive ? 'bg-green-400' : 'bg-[var(--text-muted)]')} />
          {selected.isActive ? t('common:badge.active') : t('common:badge.inactive')}
        </span>
      </div>

      {saveStatus === 'error' && saveError && (
        <div className="mx-6 mt-3 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          ⚠ {saveError}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          {t(settingsTitleKey(segment) as never)}
        </h2>
        {children}
      </div>

      {/* Save bar */}
      {isDirty && (
        <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-card)] flex-shrink-0">
          <span className={cn('text-sm', {
            'text-[var(--text-muted)]': saveStatus === 'idle',
            'text-[var(--text-muted)] animate-pulse': saveStatus === 'saving',
            'text-green-400': saveStatus === 'saved',
            'text-red-400': saveStatus === 'error',
          })}>
            {saveStatus === 'saving' ? t('common:saveBar.saving') :
             saveStatus === 'saved'  ? t('common:saveBar.saved') :
             saveStatus === 'error'  ? (saveError ?? t('common:saveBar.failed')) :
             t('common:saveBar.unsaved')}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={discardChanges}
              disabled={saveStatus === 'saving'}
            >
              {t('common:saveBar.discard')}
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? t('common:saveBar.saving') : t('common:saveBar.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
