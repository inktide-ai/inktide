'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/shared/ui/dropdown-menu'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipPortal, TooltipContent } from '@/shared/ui/tooltip'
import { ChevronsUpDown, Pause } from 'lucide-react'
import { Play, Upload, Star } from '@/shared/ui/icons'
import { cn } from '@/lib/utils'
import { ScopeSwitcher } from './scope-switcher'

const tooltipClass = cn(
  'z-[3000] max-w-[240px] rounded-md border border-[var(--border-default)] bg-[var(--menu-panel-bg)] px-2.5 py-1.5',
  'text-body leading-snug text-[var(--text-primary)] shadow-md',
)

const menuContentClass = cn(
  'z-[3000] min-w-[10rem] overflow-hidden rounded-md border border-[var(--border-default)]',
  'bg-[var(--menu-panel-bg)] p-1 text-body text-[var(--text-primary)] shadow-md',
)

const menuItemClass = cn(
  'flex cursor-default select-none items-center gap-2 rounded-[6px] px-2 py-1.5 outline-none',
  'text-[var(--text-secondary)] data-[highlighted]:bg-[var(--surface-1)] data-[disabled]:opacity-50',
)

const menuItemDangerClass = cn(
  'flex cursor-default select-none items-center gap-2 rounded-[6px] px-2 py-1.5 outline-none',
  'text-[var(--danger-text)] data-[highlighted]:bg-[var(--danger-bg)] data-[disabled]:opacity-50',
)

const iconBtnClass =
  'grid h-6 w-6 place-items-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-1)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface-topbar)]'

export interface MoreActionItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
  separator?: boolean
}

interface AppTopBarProps {
  title: string
  variant?: 'entity' | 'page'
  parentLabel?: string
  parentHref?: string
  titleHref?: string
  subTitle?: string
  showStar?: boolean
  online?: boolean | null
  showActions?: boolean
  isPlaying?: boolean
  onTogglePlay?: () => Promise<void> | void
  onExport?: () => Promise<void> | void
  moreItems?: MoreActionItem[]
}

const Slash = () => (
  <svg height="16" viewBox="0 0 16 16" width="16" aria-hidden className="text-[var(--text-tertiary)]">
    <path fillRule="evenodd" clipRule="evenodd" d="M4.01526 15.3939L4.3107 14.7046L10.3107 0.704556L10.6061 0.0151978L11.9849 0.606077L11.6894 1.29544L5.68942 15.2954L5.39398 15.9848L4.01526 15.3939Z" fill="currentColor" />
  </svg>
)

export function AppTopBar({
  title,
  variant = 'entity',
  parentLabel,
  parentHref,
  titleHref,
  subTitle,
  showStar = false,
  online = null,
  showActions = false,
  isPlaying = false,
  onTogglePlay,
  onExport,
  moreItems,
}: AppTopBarProps) {
  return (
    <TooltipProvider delayDuration={400} skipDelayDuration={200}>
      <div className="relative flex h-14 shrink-0 items-center border-b border-[var(--border-divider)] pl-12 pr-4 bg-[var(--bg-0)] lg:px-4">

        {/* Left */}
        {variant === 'page' ? (
          <ScopeSwitcher />
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            {titleHref ? (
              <Link
                href={titleHref}
                className="flex items-center gap-1 text-body font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--text-secondary)]"
              >
                {title}
                <ChevronsUpDown size={13} className="text-[var(--text-tertiary)]" />
              </Link>
            ) : (
              <span className="text-body font-medium text-[var(--text-primary)]">{title}</span>
            )}
            {showStar && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="grid h-6 w-6 place-items-center rounded text-[var(--text-tertiary)] outline-none transition-colors hover:text-[var(--color-star)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface-topbar)]"
                  >
                    <Star size={13} />
                  </button>
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent side="bottom" sideOffset={6} className={tooltipClass}>
                    Add to favorites
                  </TooltipContent>
                </TooltipPortal>
              </Tooltip>
            )}
          </div>
        )}

        {/* Center */}
        {variant === 'page' ? (
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="text-body font-medium text-[var(--text-primary)]">{title}</span>
          </div>
        ) : parentLabel && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {parentHref ? (
              <Link href={parentHref} className="text-body font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:underline">
                {parentLabel}
              </Link>
            ) : (
              <span className="text-body font-medium text-[var(--text-secondary)]">{parentLabel}</span>
            )}
            <Slash />
            {subTitle ? (
              titleHref ? (
                <Link href={titleHref} className="text-body font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:underline">
                  {title}
                </Link>
              ) : (
                <span className="text-body font-medium text-[var(--text-secondary)]">{title}</span>
              )
            ) : (
              <span className="text-body font-medium text-[var(--text-primary)]">{title}</span>
            )}
            {subTitle && (
              <>
                <Slash />
                <span className="text-body font-medium text-[var(--text-primary)]">{subTitle}</span>
              </>
            )}
          </div>
        )}

        {/* Right */}
        <div className="ml-auto flex items-center gap-1">
          {online !== null && (
            <span
              className={`mr-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                online
                  ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
              }`}
            >
              {online ? 'Online' : 'Offline'}
            </span>
          )}

          {showActions && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={iconBtnClass}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  onClick={() => void onTogglePlay?.()}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                </button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="bottom" sideOffset={6} className={tooltipClass}>
                  {isPlaying ? 'Pause project' : 'Resume project'}
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}

          {onExport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={iconBtnClass}
                  aria-label="Export"
                  onClick={() => void onExport()}
                >
                  <Upload size={13} />
                </button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="bottom" sideOffset={6} className={tooltipClass}>
                  Export .inkt
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}

          {/* ⋯ always visible */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={iconBtnClass} aria-label="More actions">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" clipRule="evenodd" d="M4 8C4 8.82843 3.32843 9.5 2.5 9.5C1.67157 9.5 1 8.82843 1 8C1 7.17157 1.67157 6.5 2.5 6.5C3.32843 6.5 4 7.17157 4 8ZM9.5 8C9.5 8.82843 8.82843 9.5 8 9.5C7.17157 9.5 6.5 8.82843 6.5 8C6.5 7.17157 7.17157 6.5 8 6.5C8.82843 6.5 9.5 7.17157 9.5 8ZM13.5 9.5C14.3284 9.5 15 8.82843 15 8C15 7.17157 14.3284 6.5 13.5 6.5C12.6716 6.5 12 7.17157 12 8C12 8.82843 12.6716 9.5 13.5 9.5Z" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="bottom" sideOffset={6} className={tooltipClass}>
                  More actions
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
            <DropdownMenuPortal>
              <DropdownMenuContent className={menuContentClass} align="end" sideOffset={6}>
                {moreItems && moreItems.length > 0 ? (
                  moreItems.map((item, i) => (
                    item.separator ? (
                      <DropdownMenuSeparator key={i} className="my-1 h-px bg-[var(--border-subtle)]" />
                    ) : (
                      <DropdownMenuItem
                        key={i}
                        className={item.danger ? menuItemDangerClass : menuItemClass}
                        onClick={item.onClick}
                      >
                        {item.icon}
                        {item.label}
                      </DropdownMenuItem>
                    )
                  ))
                ) : (
                  <DropdownMenuItem disabled className={menuItemClass}>
                    No actions available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>

      </div>
    </TooltipProvider>
  )
}
