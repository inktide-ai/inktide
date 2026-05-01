import { keycloak } from '@/lib/keycloak'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KcAccountProfile {
  id?: string
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  emailVerified?: boolean
  attributes?: Record<string, string[]>
}

export interface KcSession {
  id: string
  ipAddress?: string
  started?: number
  lastAccess?: number
  expires?: number
  browser?: string
  os?: string
  osVersion?: string
  device?: string
  current?: boolean
  clients?: Record<string, string>
}

export interface KcCredential {
  id: string
  type: string
  userLabel?: string
  createdDate?: number
  credentialData?: string
}

export interface KcLinkedAccount {
  connected: boolean
  social: boolean
  providerAlias: string
  providerName: string
  displayName?: string
  linkedUsername?: string
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function kcAccountBase(): string {
  const url = (process.env.NEXT_PUBLIC_KEYCLOAK_URL as string | undefined) ?? 'http://localhost:8080'
  const realm = (process.env.NEXT_PUBLIC_KEYCLOAK_REALM as string | undefined) ?? 'inktide'
  return `${url}/realms/${realm}/account`
}

async function kcFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = keycloak.token
  if (!token) throw new Error('Not authenticated')
  const base = kcAccountBase()
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let msg = `KC Account API error ${res.status}`
    try {
      const body = await res.json() as { errorMessage?: string; error?: string }
      msg = body.errorMessage ?? body.error ?? msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  return res
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getKcProfile(): Promise<KcAccountProfile> {
  const res = await kcFetch('')
  return res.json() as Promise<KcAccountProfile>
}

export async function updateKcProfile(data: KcAccountProfile): Promise<void> {
  await kcFetch('', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ── Password ──────────────────────────────────────────────────────────────────

export async function changeKcPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await kcFetch('/credentials/password', {
    method: 'POST',
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmation: newPassword,
    }),
  })
}

// ── Credentials (2FA) ─────────────────────────────────────────────────────────

export async function getKcCredentials(): Promise<KcCredential[]> {
  const res = await kcFetch('/credentials')
  return res.json() as Promise<KcCredential[]>
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getKcSessions(): Promise<KcSession[]> {
  const res = await kcFetch('/sessions')
  return res.json() as Promise<KcSession[]>
}

export async function revokeKcSession(sessionId: string): Promise<void> {
  await kcFetch(`/sessions/${sessionId}`, { method: 'DELETE' })
}

export async function revokeAllKcSessions(): Promise<void> {
  await kcFetch('/sessions', { method: 'DELETE' })
}

// ── Linked accounts ───────────────────────────────────────────────────────────

export async function getKcLinkedAccounts(): Promise<KcLinkedAccount[]> {
  const res = await kcFetch('/linked-accounts')
  return res.json() as Promise<KcLinkedAccount[]>
}

export async function deleteKcLinkedAccount(providerAlias: string): Promise<void> {
  await kcFetch(`/linked-accounts/${providerAlias}`, { method: 'DELETE' })
}
