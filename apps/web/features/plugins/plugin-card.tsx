'use client'

import { type ReactNode } from 'react'

interface PluginCardProps {
  pluginId: string
  name: string
  description: string
  icon: ReactNode
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  configSlot?: ReactNode
  saving?: boolean
}

export function PluginCard({
  name,
  description,
  icon,
  isEnabled,
  onToggle,
  configSlot,
  saving = false,
}: PluginCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] transition-colors">
      <div className="flex flex-row items-center justify-between gap-4 px-4 py-3">
        {/* left: icon + info */}
        <div className="flex flex-row items-center gap-3 min-w-0">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-2)]">
            {icon}
            <span className="pointer-events-none absolute inset-0 rounded-full border border-[#ffffff24]" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-row items-center gap-2">
              <span className="text-[0.875rem] font-medium leading-5 text-[var(--text-primary)]">{name}</span>
              {isEnabled ? (
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[0.6875rem] font-medium text-green-500">
                  <span className="h-1 w-1 rounded-full bg-green-500" aria-hidden />
                  Enabled
                </span>
              ) : (
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--text-tertiary)]">
                  Disabled
                </span>
              )}
            </div>
            <span className="truncate text-[0.8125rem] text-[var(--text-secondary)]">{description}</span>
          </div>
        </div>

        {/* right: toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          disabled={saving}
          onClick={() => onToggle(!isEnabled)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
            isEnabled ? 'bg-green-500' : 'bg-[var(--surface-3)]'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              isEnabled ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* config slot — shown when plugin is enabled and slot is provided */}
      {isEnabled && configSlot && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-3">
          {configSlot}
        </div>
      )}
    </div>
  )
}
