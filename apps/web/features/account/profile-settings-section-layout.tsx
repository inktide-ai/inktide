'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { PROFILE_SETTINGS_BASE } from '@/lib/routes'
import { Button } from '@/shared/ui/button'
import { ScrollArea } from '@/shared/ui/scroll-area'
import {
  IconUser, IconSkills, IconBrain, IconMicrophone,
  IconPaint, IconIntegration, IconScene, IconMemory, IconObs,
} from '@/features/character-editor/tab-icons'

interface NavItem {
  segment: string
  tabId: string
  icon: ReactNode
}

const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
  {
    section: 'Character',
    items: [
      { segment: 'identity',  tabId: 'profile',    icon: <IconUser /> },
      { segment: 'skills',    tabId: 'skills',     icon: <IconSkills /> },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { segment: 'brain',  tabId: 'brain',  icon: <IconBrain /> },
      { segment: 'memory', tabId: 'memory', icon: <IconMemory /> },
    ],
  },
  {
    section: 'Output',
    items: [
      { segment: 'voice', tabId: 'voice',   icon: <IconMicrophone /> },
      { segment: 'model', tabId: 'avatars', icon: <IconPaint /> },
      { segment: 'scene', tabId: 'scene',   icon: <IconScene /> },
      { segment: 'obs',   tabId: 'obs',     icon: <IconObs /> },
    ],
  },
  {
    section: 'Distribution',
    items: [
      { segment: 'channels', tabId: 'connection', icon: <IconIntegration /> },
    ],
  },
]

const TAB_CLS = cn(
  'flex h-[28px] w-full cursor-pointer select-none items-center gap-2',
  'rounded-[6px] border-none bg-transparent px-[6px] py-[4px]',
  'text-left text-[14px] font-medium leading-[20px] transition-colors',
  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-soft)] focus-visible:ring-offset-1',
)

interface Props {
  children: ReactNode
}

export default function ProfileSettingsSectionLayout({ children }: Props) {
  const { t } = useTranslation(['common', 'profile'])
  const pathname = usePathname()
  const { selected, isDirty, saveStatus, saveError, discardChanges, handleSave } = useCharactersContext()

  const segment = pathname.replace(`${PROFILE_SETTINGS_BASE}/`, '').split('/')[0] ?? ''
  const activeNav = NAV_SECTIONS.flatMap(s => s.items).find(i => i.segment === segment)
  const title    = activeNav ? t(`profile:tabs.${activeNav.tabId}.label` as never) : ''
  const subtitle = activeNav ? t(`profile:tabs.${activeNav.tabId}.desc`  as never) : ''

  if (!selected) return null

  const initial = selected.name.charAt(0).toUpperCase()

  return (
    <div className="flex h-full min-h-0 w-full flex-row gap-0 overflow-hidden bg-(--bg-settings)">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <div className="flex w-[240px] shrink-0 flex-col border-r border-[var(--border-divider)] bg-[var(--c-bacSec)] overflow-y-auto">
        <nav className="flex flex-col gap-3 px-2 py-2">
          {NAV_SECTIONS.map(group => (
            <div key={group.section} className="flex flex-col gap-0.5">
              <div className="px-2 py-[6px] text-[12px] font-medium leading-[16px] text-[var(--text-tertiary)] overflow-hidden text-ellipsis">
                {group.section}
              </div>

              {group.items.map(item => {
                const active = segment === item.segment
                const isIdentity = item.segment === 'identity'
                return (
                  <Link
                    key={item.segment}
                    href={`${PROFILE_SETTINGS_BASE}/${item.segment}`}
                    className={cn(TAB_CLS,
                      active
                        ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)] hover:bg-[var(--sidebar-active)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    {isIdentity ? (
                      <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center">
                        <div className="h-[22px] w-[22px] select-none rounded-full overflow-hidden">
                          {selected.appearance?.avatarUrl
                            ? <img src={selected.appearance.avatarUrl} alt="" className="block h-full w-full rounded-full object-cover outline outline-1 -outline-offset-1 outline-[var(--border-divider)]" />
                            : <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#8456FF] to-[#EC4899] text-2xs font-medium text-white">{initial}</div>
                          }
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center [&>svg]:h-[16px] [&>svg]:w-[16px]">
                        {item.icon}
                      </div>
                    )}
                    <span className="truncate">
                      {t(`profile:tabs.${item.tabId}.label` as never)}
                    </span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Content panel ────────────────────────────────────────────────── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg-primary)]">
        <ScrollArea className="min-h-0 min-w-0 flex-1">
          <div className="flex justify-center items-start px-[clamp(18px,5vw,60px)] py-9">
            <div className="flex flex-col gap-9 w-full max-w-[800px]">
              <header>
                <div className="text-[26px] font-semibold leading-[32px] tracking-[-0.01em] text-[var(--text-heading)]">
                  {title}
                </div>
                <div className="mt-[2px] text-[16px] leading-[24px] text-[var(--text-tertiary)]">
                  {subtitle}
                </div>
              </header>
              <section>
                {children}
              </section>
            </div>
          </div>
        </ScrollArea>

        {/* Save bar */}
        {isDirty && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[var(--border-divider)] bg-[var(--bg-primary)] px-6 py-3">
            <span className={cn('text-sm', {
              'text-[var(--text-tertiary)]': saveStatus === 'idle',
              'text-[var(--text-tertiary)] animate-pulse': saveStatus === 'saving',
              'text-green-400': saveStatus === 'saved',
              'text-red-400': saveStatus === 'error',
            })}>
              {saveStatus === 'saving' ? t('common:saveBar.saving') :
               saveStatus === 'saved'  ? t('common:saveBar.saved')  :
               saveStatus === 'error'  ? (saveError ?? t('common:saveBar.failed')) :
               t('common:saveBar.unsaved')}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={discardChanges} disabled={saveStatus === 'saving'}>
                {t('common:saveBar.discard')}
              </Button>
              <Button size="sm" onClick={() => void handleSave()} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? t('common:saveBar.saving') : t('common:saveBar.save')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
