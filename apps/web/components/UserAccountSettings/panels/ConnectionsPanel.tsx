'use client'
import { useEffect, useState } from 'react'
import {
  getKcLinkedAccounts,
  deleteKcLinkedAccount,
  type KcLinkedAccount,
} from '../../../api/keycloak-account'
import styles from '../UserAccountSettings.module.css'

interface Props {
  onDirty: (dirty: boolean) => void
  saveRef: React.MutableRefObject<(() => Promise<void>) | null>
  onCancelRef: React.MutableRefObject<(() => void) | null>
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l3 3"/>
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

// Map Keycloak provider alias → display meta
const PROVIDER_META: Record<string, { name: string; iconClass: string; icon: React.ReactNode }> = {
  discord:  { name: 'Discord',  iconClass: styles.connIconDiscord, icon: <DiscordIcon /> },
  google:   { name: 'Google',   iconClass: styles.connIconGoogle,  icon: <GoogleIcon /> },
  github:   { name: 'GitHub',   iconClass: styles.connIconGithub,  icon: <GithubIcon /> },
}

function getProviderMeta(alias: string, kcName?: string) {
  return PROVIDER_META[alias.toLowerCase()] ?? {
    name: kcName ?? alias,
    iconClass: styles.connIconDefault,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
      </svg>
    ),
  }
}

export default function ConnectionsPanel({ onDirty, saveRef, onCancelRef }: Props) {
  const [accounts, setAccounts] = useState<KcLinkedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [apiKeyVisible, setApiKeyVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    getKcLinkedAccounts()
      .then((a) => { if (!cancelled) setAccounts(a) })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load accounts') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => { onDirty(false) }, [onDirty])
  useEffect(() => {
    saveRef.current = async () => { /* nothing */ }
    onCancelRef.current = () => { /* nothing */ }
  })

  async function handleDisconnect(alias: string) {
    setDisconnecting(alias)
    try {
      await deleteKcLinkedAccount(alias)
      setAccounts((prev) => prev.map((a) => a.providerAlias === alias ? { ...a, connected: false, linkedUsername: undefined } : a))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect account')
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconBlue}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Connected accounts</span>
        </div>
        <div className={styles.cardBody}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          {loading && <div className={styles.loadingText}>Loading…</div>}
          {!loading && accounts.map((acc) => {
            const meta = getProviderMeta(acc.providerAlias, acc.providerName)
            return (
              <div key={acc.providerAlias} className={styles.connItem}>
                <div className={styles.connLeft}>
                  <div className={`${styles.connIcon} ${meta.iconClass}`}>
                    {meta.icon}
                  </div>
                  <div>
                    <div className={styles.connName}>{meta.name}</div>
                    <div className={styles.connSub}>
                      {acc.connected && acc.linkedUsername
                        ? `${acc.linkedUsername} · Connected`
                        : 'Not connected'}
                    </div>
                  </div>
                </div>
                {acc.connected
                  ? (
                    <button
                      className={`${styles.btnSm} ${styles.btnRed}`}
                      disabled={disconnecting === acc.providerAlias}
                      onClick={() => void handleDisconnect(acc.providerAlias)}
                    >
                      {disconnecting === acc.providerAlias ? '…' : 'Disconnect'}
                    </button>
                  )
                  : (
                    <button className={`${styles.btnSm} ${styles.btnBlue}`} disabled>
                      Connect
                    </button>
                  )}
              </div>
            )
          })}
          {!loading && accounts.length === 0 && (
            <div className={styles.loadingText}>No linked accounts configured in Keycloak</div>
          )}
        </div>
      </div>

      {/* API access */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconLime}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>API access</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerRowLabel}>API key</div>
              <div className={styles.dangerRowSub}>
                {apiKeyVisible ? '••••••••••••••••••••••••••' : 'Use this to connect external tools'}
              </div>
            </div>
            <button
              className={`${styles.btnSm} ${styles.btnGhost}`}
              onClick={() => setApiKeyVisible((v) => !v)}
            >
              {apiKeyVisible ? 'Hide' : 'Reveal'}
            </button>
          </div>
          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerRowLabel}>Webhooks</div>
              <div className={styles.dangerRowSub}>Receive events at your endpoint</div>
            </div>
            <button className={`${styles.btnSm} ${styles.btnBlue}`} disabled>Configure</button>
          </div>
          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerRowLabel}>Regenerate key</div>
              <div className={styles.dangerRowSub}>Invalidates the current API key</div>
            </div>
            <button className={`${styles.btnSm} ${styles.btnRed}`} disabled>Regenerate</button>
          </div>
        </div>
      </div>
    </>
  )
}
