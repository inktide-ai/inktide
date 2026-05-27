'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Play, Share, Star, Upload } from '@/shared/ui/icons'
import { cn } from '@/lib/utils'

const tooltipClass = cn(
  'z-[3000] max-w-[240px] rounded-md border border-[var(--border-default)] bg-[var(--menu-panel-bg)] px-2.5 py-1.5',
  'text-[14px] leading-snug text-[var(--text-primary)] shadow-md',
)

const menuContentClass = cn(
  'z-[3000] min-w-[10rem] overflow-hidden rounded-md border border-[var(--border-default)]',
  'bg-[var(--menu-panel-bg)] p-1 text-[14px] text-[var(--text-primary)] shadow-md',
)

const menuItemClass = cn(
  'flex cursor-default select-none items-center rounded-[6px] px-2 py-1.5 outline-none',
  'text-[var(--text-secondary)] data-[highlighted]:bg-[var(--surface-1)] data-[disabled]:opacity-50',
)

const iconBtnClass =
  'grid h-6 w-6 place-items-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-1)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface-topbar)]'

interface SoulBreadcrumbProps {
  soulName: string
  online: boolean
}

export function SoulBreadcrumb({ soulName, online }: SoulBreadcrumbProps) {
  return (
    <Tooltip.Provider delayDuration={400} skipDelayDuration={200}>
      <div className="relative flex h-14 items-center border-b border-[var(--border-divider)] bg-[var(--bg-0)] px-4">

        {/* Left — soul name + star */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[14px] font-medium text-[var(--text-primary)]">{soulName}</span>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                className="grid h-6 w-6 place-items-center rounded text-[var(--text-tertiary)] outline-none transition-colors hover:text-[#FFD35C] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface-topbar)]"
              >
                <Star size={13} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom" sideOffset={6} className={tooltipClass}>
                Add to favorites
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>

        {/* Center — breadcrumb path (absolute) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="text-[14px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:underline cursor-pointer">
            Souls
          </span>
          <svg height="16" viewBox="0 0 16 16" width="16" aria-hidden className="text-[var(--text-tertiary)]">
            <path fillRule="evenodd" clipRule="evenodd" d="M4.01526 15.3939L4.3107 14.7046L10.3107 0.704556L10.6061 0.0151978L11.9849 0.606077L11.6894 1.29544L5.68942 15.2954L5.39398 15.9848L4.01526 15.3939Z" fill="currentColor" />
          </svg>
          <span className="text-[14px] font-medium text-[var(--text-primary)]">{soulName}</span>
        </div>

        {/* Right — status + actions */}
        <div className="ml-auto flex items-center gap-1 pr-0">
          <span
            className={`mr-1 rounded-full px-2 py-0.5 text-[12px] font-medium ${online ? 'bg-[var(--success-bg)] text-[var(--success-text)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}
          >
            {online ? 'Online' : 'Offline'}
          </span>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button type="button" className={iconBtnClass} aria-label="Play">
                <Play size={13} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom" sideOffset={6} className={tooltipClass}>
                Play / stream
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <DropdownMenu.Root>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <DropdownMenu.Trigger asChild>
                  <button type="button" className={iconBtnClass} aria-label="Share">
                    <Share size={13} />
                  </button>
                </DropdownMenu.Trigger>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom" sideOffset={6} className={tooltipClass}>
                  Share
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={menuContentClass} align="end" sideOffset={6}>
                <DropdownMenu.Item disabled className={menuItemClass}>
                  Coming soon
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <DropdownMenu.Root>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <DropdownMenu.Trigger asChild>
                  <button type="button" className={iconBtnClass} aria-label="Upload">
                    <Upload size={13} />
                  </button>
                </DropdownMenu.Trigger>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom" sideOffset={6} className={tooltipClass}>
                  Upload
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={menuContentClass} align="end" sideOffset={6}>
                <DropdownMenu.Item disabled className={menuItemClass}>
                  Coming soon
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Three dots menu — like Vercel's right-side action */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button type="button" className={iconBtnClass} aria-label="More actions">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" clipRule="evenodd" d="M4 8C4 8.82843 3.32843 9.5 2.5 9.5C1.67157 9.5 1 8.82843 1 8C1 7.17157 1.67157 6.5 2.5 6.5C3.32843 6.5 4 7.17157 4 8ZM9.5 8C9.5 8.82843 8.82843 9.5 8 9.5C7.17157 9.5 6.5 8.82843 6.5 8C6.5 7.17157 7.17157 6.5 8 6.5C8.82843 6.5 9.5 7.17157 9.5 8ZM13.5 9.5C14.3284 9.5 15 8.82843 15 8C15 7.17157 14.3284 6.5 13.5 6.5C12.6716 6.5 12 7.17157 12 8C12 8.82843 12.6716 9.5 13.5 9.5Z" />
                </svg>
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom" sideOffset={6} className={tooltipClass}>
                More actions
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>

      </div>
    </Tooltip.Provider>
  )
}
