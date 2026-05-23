'use client'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { validateDiscordToken } from '@/api/soul'
import { CredentialStatusBadge, type CredentialStatus } from '@/components/soul/credential-status-badge'

const iconCls = 'w-5 h-5'

export function ChIconDiscord() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={iconCls}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

export interface ChannelPlatformDef {
  id: string
  title: string
  subtitle: string
  bg: string
  fg: string
  icon: React.ReactNode
}

export const DISCORD_PLATFORM: ChannelPlatformDef = {
  id: 'discord',
  title: 'Discord',
  subtitle: 'Chat & community via Discord bot.',
  bg: 'rgba(88,101,242,0.15)',
  fg: '#5865f2',
  icon: <ChIconDiscord />,
}

export function WizardDiscordConfig({
  botToken,
  onChange,
  onConfirm,
}: {
  botToken: string
  onChange: (token: string) => void
  onConfirm: () => void
}) {
  const inputCls = cn(
    'h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-3',
    'home-ui-font text-[14px] text-[var(--text-primary)] outline-none',
    'placeholder:text-[var(--text-tertiary)] transition-colors',
    'focus:border-[var(--accent-base)]/50 focus:bg-[var(--surface-2)]',
  )

  const [testStatus, setTestStatus] = useState<CredentialStatus>('untested')
  const [testError, setTestError] = useState<string | null>(null)
  const [hasTested, setHasTested] = useState(false)

  useEffect(() => {
    setTestStatus('untested')
    setTestError(null)
    setHasTested(false)
  }, [botToken])

  const handleClick = async () => {
    if (botToken && !hasTested) {
      setTestStatus('testing')
      try {
        const result = await validateDiscordToken(botToken)
        setTestStatus(result.valid ? 'verified' : 'failed')
        setTestError(result.error)
      } catch {
        setTestStatus('failed')
        setTestError('Could not reach validation service')
      }
      setHasTested(true)
      return
    }
    onConfirm()
  }

  const isTesting = testStatus === 'testing'
  const buttonLabel = isTesting
    ? 'Testing…'
    : hasTested && testStatus === 'verified'
      ? 'Continue ✓'
      : hasTested && testStatus === 'failed'
        ? 'Continue anyway'
        : 'Продолжить'

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
            style={{ background: DISCORD_PLATFORM.bg, color: DISCORD_PLATFORM.fg }}
          >
            <ChIconDiscord />
          </div>
          <div className="min-w-0">
            <p className="home-ui-font truncate text-[14px] font-semibold text-[var(--text-primary)]">Discord</p>
            <p className="home-ui-font truncate text-[11.5px] text-[var(--text-tertiary)]">Connect your Discord bot</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar space-y-4">
        <a
          href="/api/auth/discord"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
          style={{ background: '#5865f2' }}
        >
          <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className="h-4 w-4">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Connect with Discord
        </a>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span className="home-ui-font text-[12px] text-[var(--text-tertiary)]">or enter token manually</span>
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="home-ui-font text-[12px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
              Bot Token
            </span>
            {testStatus !== 'untested' && (
              <CredentialStatusBadge status={testStatus} error={testError} />
            )}
          </div>
          <input
            type="password"
            value={botToken}
            onChange={e => onChange(e.target.value)}
            placeholder="Discord bot token"
            className={inputCls}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-[var(--border-subtle)] px-5 py-4">
        <button
          type="button"
          onClick={handleClick}
          disabled={isTesting}
          className="home-ui-font flex h-9 w-full items-center justify-center rounded-xl text-[14px] font-semibold text-white transition-colors hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent-base)' }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
