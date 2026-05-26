'use client'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  deleteKcLinkedAccount,
  getKcLinkedAccounts,
  type KcLinkedAccount,
} from '@/api/keycloak-account'

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
  )
}

function TwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.149 0L.537 4.119v16.836h5.731V24h3.224l3.045-3.045h4.657l6.269-6.269V0H2.149zm2.149 2.149h17.164v11.612l-3.582 3.582h-5.731l-3.045 3.045v-3.045H4.298V2.149zm5.731 11.612h2.149V7.642H9.91v6.119zm5.731 0h2.149V7.642h-2.149v6.119z"/></svg>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
  )
}

function GenericIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  )
}

interface ProviderMeta {
  name: string
  iconCls: string
  icon: React.ReactNode
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  discord: { name: 'Discord',  iconCls: 'bg-[#5865F229] text-[#7b89f5]', icon: <DiscordIcon /> },
  twitch:  { name: 'Twitch',   iconCls: 'bg-[#9146FF29] text-[#a983ff]',  icon: <TwitchIcon /> },
  github:  { name: 'GitHub',   iconCls: 'bg-[var(--surface-2)] text-[var(--text-secondary)]', icon: <GithubIcon /> },
  google:  { name: 'Google',   iconCls: 'bg-[#34A85329] text-[#5fc880]', icon: <GoogleIcon /> },
}

function getProviderMeta(alias: string, fallback?: string): ProviderMeta {
  return PROVIDER_META[alias.toLowerCase()] ?? {
    name: fallback ?? alias,
    iconCls: 'bg-[var(--accent-violet-bg)] text-[var(--accent-violet-text)]',
    icon: <GenericIcon />,
  }
}

const SUGGESTED_INTEGRATIONS = [
  { alias: 'google', name: 'Google', sub: 'Connect your Google account.' },
]

export default function ConnectionsPanel() {
  const [accounts, setAccounts] = useState<KcLinkedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyAlias, setBusyAlias] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getKcLinkedAccounts()
      .then((a) => { if (!cancelled) setAccounts(a) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load accounts') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const connected = useMemo(() => accounts.filter((a) => a.connected), [accounts])
  const availableFromKc = useMemo(() => accounts.filter((a) => !a.connected), [accounts])
  const fallbackAvailable = SUGGESTED_INTEGRATIONS.filter(
    (s) => !accounts.some((a) => a.providerAlias.toLowerCase() === s.alias),
  )

  async function handleDisconnect(alias: string) {
    setBusyAlias(alias)
    setError(null)
    try {
      await deleteKcLinkedAccount(alias)
      setAccounts((prev) => prev.map((a) => a.providerAlias === alias ? { ...a, connected: false, linkedUsername: undefined } : a))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect account')
    } finally {
      setBusyAlias(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mt-[16px] rounded-[8px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-[14px] text-[var(--danger-text)]">
          {error}
        </div>
      )}

      {/* ── Connected Accounts ────────────────────────────────────────────── */}
      <div className="mt-[36px]" />
      <SectionHeader>Connected accounts</SectionHeader>

      <div>
        {loading && <div className="py-6 text-center text-[14px] text-[var(--text-disabled)]">Loading…</div>}
        {!loading && connected.length === 0 && (
          <div className="py-6 text-center text-[14px] text-[var(--text-disabled)]">No connected accounts yet.</div>
        )}
        {!loading && connected.map((acc, idx) => {
          const meta = getProviderMeta(acc.providerAlias, acc.providerName)
          return (
            <div key={acc.providerAlias}>
              {idx > 0 && <div className="h-[24px]" />}
              <ProviderRow
                meta={meta}
                title={meta.name}
                sub={acc.linkedUsername ?? 'Connected'}
                action={
                  <button
                    type="button"
                    onClick={() => void handleDisconnect(acc.providerAlias)}
                    disabled={busyAlias === acc.providerAlias}
                    className="shrink-0 rounded-[7px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-[5px] text-[14px] font-medium text-[var(--danger-text)] transition-opacity hover:opacity-80 disabled:opacity-40"
                  >
                    {busyAlias === acc.providerAlias ? '…' : 'Disconnect'}
                  </button>
                }
              />
            </div>
          )
        })}
      </div>

      {/* ── Available Integrations ────────────────────────────────────────── */}
      <div className="mt-[48px]" />
      <SectionHeader>Available integrations</SectionHeader>

      <div>
        {loading && <div className="py-6 text-center text-[14px] text-[var(--text-disabled)]">Loading…</div>}
        {!loading && availableFromKc.length === 0 && fallbackAvailable.length === 0 && (
          <div className="py-6 text-center text-[14px] text-[var(--text-disabled)]">All available providers are connected.</div>
        )}
        {!loading && availableFromKc.map((acc, idx) => {
          const meta = getProviderMeta(acc.providerAlias, acc.providerName)
          return (
            <div key={`avail-${acc.providerAlias}`}>
              {idx > 0 && <div className="h-[24px]" />}
              <ProviderRow
                meta={meta}
                title={meta.name}
                sub={`Connect your ${meta.name} account.`}
                action={
                  <button
                    type="button"
                    disabled
                    className="shrink-0 rounded-[7px] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-[5px] text-[14px] font-medium text-[var(--text-primary)] opacity-70"
                    title="Connect via Keycloak account portal"
                  >
                    Connect
                  </button>
                }
              />
            </div>
          )
        })}
        {!loading && fallbackAvailable.map((s, idx) => {
          const meta = getProviderMeta(s.alias, s.name)
          return (
            <div key={`fb-${s.alias}`}>
              {(idx > 0 || availableFromKc.length > 0) && <div className="h-[24px]" />}
              <ProviderRow
                meta={meta}
                title={s.name}
                sub={s.sub}
                action={
                  <button
                    type="button"
                    disabled
                    className="shrink-0 rounded-[7px] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-[5px] text-[14px] font-medium text-[var(--text-primary)] opacity-70"
                  >
                    Connect
                  </button>
                }
              />
            </div>
          )
        })}
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

function ProviderRow({
  meta,
  title,
  sub,
  action,
}: {
  meta: ProviderMeta
  title: string
  sub?: string
  action: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-[11px]">
      <div className="flex min-w-[200px] flex-1 items-center gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full [&>svg]:h-[16px] [&>svg]:w-[16px]', meta.iconCls)}>
          {meta.icon}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="text-[14px] font-medium leading-[20px] text-[var(--text-primary)]">{title}</div>
          {sub && <div className="text-[14px] font-normal leading-[18px] text-pretty text-[var(--text-secondary)]">{sub}</div>}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}
