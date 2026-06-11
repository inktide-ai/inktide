'use client'
import { useTranslation } from 'react-i18next'
import { Toggle } from '@/shared/ui/toggle'
import { useNotificationPrefs } from '@/shared/hooks/useNotificationPrefs'

export default function NotificationsPanel() {
  const { t } = useTranslation('account')
  const { prefs, update } = useNotificationPrefs()

  const masterOff = !prefs.enabled

  return (
    <>
      <div className="mt-[36px]" />
      <SectionHeader>{t('notifications.enable')}</SectionHeader>

      <div>
        <SecurityRow
          label={t('notifications.enable')}
          value={t('notifications.enableDesc')}
          action={<Toggle checked={prefs.enabled} onChange={(v) => update('enabled', v)} ariaLabel={t('notifications.enable')} />}
        />
      </div>

      <div className="mt-[48px]" />
      <SectionHeader>{t('notifications.email')}</SectionHeader>

      <div className={masterOff ? 'opacity-60' : ''}>
        <SecurityRow
          label={t('notifications.emailMentions')}
          value={t('notifications.emailMentionsDesc')}
          action={<Toggle checked={prefs.emailMentions && !masterOff} onChange={(v) => update('emailMentions', v)} disabled={masterOff} ariaLabel={t('notifications.emailMentions')} />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label={t('notifications.emailMessages')}
          value={t('notifications.emailMessagesDesc')}
          action={<Toggle checked={prefs.emailMessages && !masterOff} onChange={(v) => update('emailMessages', v)} disabled={masterOff} ariaLabel={t('notifications.emailMessages')} />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label={t('notifications.emailProjects')}
          value={t('notifications.emailProjectsDesc')}
          action={<Toggle checked={prefs.emailProjectUpdates && !masterOff} onChange={(v) => update('emailProjectUpdates', v)} disabled={masterOff} ariaLabel={t('notifications.emailProjects')} />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label={t('notifications.emailSystem')}
          value={t('notifications.emailSystemDesc')}
          action={<Toggle checked={prefs.emailSystem && !masterOff} onChange={(v) => update('emailSystem', v)} disabled={masterOff} ariaLabel={t('notifications.emailSystem')} />}
        />
      </div>

      <div className="mt-[48px]" />
      <SectionHeader>{t('notifications.push')}</SectionHeader>

      <div className={masterOff ? 'opacity-60' : ''}>
        <SecurityRow
          label={t('notifications.pushMentions')}
          value={t('notifications.pushMentionsDesc')}
          action={<Toggle checked={prefs.pushMentions && !masterOff} onChange={(v) => update('pushMentions', v)} disabled={masterOff} ariaLabel={t('notifications.pushMentions')} />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label={t('notifications.pushDm')}
          value={t('notifications.pushDmDesc')}
          action={<Toggle checked={prefs.pushMessages && !masterOff} onChange={(v) => update('pushMessages', v)} disabled={masterOff} ariaLabel={t('notifications.pushDm')} />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label={t('notifications.reminders')}
          value={t('notifications.remindersDesc')}
          action={<Toggle checked={prefs.pushReminders && !masterOff} onChange={(v) => update('pushReminders', v)} disabled={masterOff} ariaLabel={t('notifications.reminders')} />}
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <div className="text-body font-medium leading-[20px] text-[var(--text-primary)]">{label}</div>
        <div className="text-body font-normal leading-[18px] text-pretty text-[var(--text-secondary)]">
          {typeof value === 'string' ? <span className="break-words">{value}</span> : value}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
