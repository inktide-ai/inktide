'use client'
import { useEffect, useState } from 'react'
import { Toggle } from '@/components/ui/toggle'

const STORAGE_KEY = 'inktide_user_notifications'

interface NotifPrefs {
  enabled: boolean
  emailMentions: boolean
  emailMessages: boolean
  emailProjectUpdates: boolean
  emailSystem: boolean
  pushMentions: boolean
  pushMessages: boolean
  pushReminders: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  enabled: true,
  emailMentions: true,
  emailMessages: true,
  emailProjectUpdates: false,
  emailSystem: true,
  pushMentions: true,
  pushMessages: false,
  pushReminders: false,
}

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) as Partial<NotifPrefs> }
  } catch { return DEFAULT_PREFS }
}

function savePrefs(p: NotifPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export default function NotificationsPanel() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)

  useEffect(() => { setPrefs(loadPrefs()) }, [])

  function update<K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) {
    setPrefs((p) => {
      const next = { ...p, [key]: value }
      savePrefs(next)
      return next
    })
  }

  const masterOff = !prefs.enabled

  return (
    <>
      {/* ── Enable Notifications ──────────────────────────────────────────── */}
      <div className="mt-[36px]" />
      <SectionHeader>Enable notifications</SectionHeader>

      <div>
        <SecurityRow
          label="Enable notifications"
          value="Receive notifications for important activity."
          action={<Toggle checked={prefs.enabled} onChange={(v) => update('enabled', v)} ariaLabel="Enable notifications" />}
        />
      </div>

      {/* ── Email Notifications ───────────────────────────────────────────── */}
      <div className="mt-[48px]" />
      <SectionHeader>Email notifications</SectionHeader>

      <div className={masterOff ? 'opacity-60' : ''}>
        <SecurityRow
          label="Mentions"
          value="Notify me when someone mentions me."
          action={<Toggle checked={prefs.emailMentions && !masterOff} onChange={(v) => update('emailMentions', v)} disabled={masterOff} ariaLabel="Mentions" />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label="Messages"
          value="Notify me when I receive a new message."
          action={<Toggle checked={prefs.emailMessages && !masterOff} onChange={(v) => update('emailMessages', v)} disabled={masterOff} ariaLabel="Messages" />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label="Project updates"
          value="Notify me about project updates and changes."
          action={<Toggle checked={prefs.emailProjectUpdates && !masterOff} onChange={(v) => update('emailProjectUpdates', v)} disabled={masterOff} ariaLabel="Project updates" />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label="System updates"
          value="Notify me about important system updates."
          action={<Toggle checked={prefs.emailSystem && !masterOff} onChange={(v) => update('emailSystem', v)} disabled={masterOff} ariaLabel="System updates" />}
        />
      </div>

      {/* ── Push Notifications ────────────────────────────────────────────── */}
      <div className="mt-[48px]" />
      <SectionHeader>Push notifications</SectionHeader>

      <div className={masterOff ? 'opacity-60' : ''}>
        <SecurityRow
          label="Mentions"
          value="Push me when someone mentions me."
          action={<Toggle checked={prefs.pushMentions && !masterOff} onChange={(v) => update('pushMentions', v)} disabled={masterOff} ariaLabel="Push mentions" />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label="Direct messages"
          value="Push me on new direct messages."
          action={<Toggle checked={prefs.pushMessages && !masterOff} onChange={(v) => update('pushMessages', v)} disabled={masterOff} ariaLabel="Push direct messages" />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label="Reminders"
          value="Reminders and scheduled events."
          action={<Toggle checked={prefs.pushReminders && !masterOff} onChange={(v) => update('pushReminders', v)} disabled={masterOff} ariaLabel="Push reminders" />}
        />
      </div>
    </>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[16px] mt-0 border-b border-[var(--settings-card-border)] pb-[12px] text-[16px] font-medium text-[var(--text-heading)]">
      {children}
    </div>
  )
}

function SecurityRow({
  label,
  value,
  action,
}: {
  label: string
  value: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-[11px]">
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <div className="text-[14px] font-medium leading-[20px] text-[var(--text-primary)]">{label}</div>
        <div className="text-[14px] font-normal leading-[18px] text-pretty text-[var(--text-secondary)]">
          {typeof value === 'string' ? <span className="break-words">{value}</span> : value}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
