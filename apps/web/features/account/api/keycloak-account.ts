
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

//
// All calls go through the BFF proxy at /api/kc-account/[[...path]] -
// the token is injected server-side; the browser never sees it.

async function kcFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/kc-account${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
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


export async function getKcCredentials(): Promise<KcCredential[]> {
  const res = await kcFetch('/credentials')
  return res.json() as Promise<KcCredential[]>
}


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


export async function getKcLinkedAccounts(): Promise<KcLinkedAccount[]> {
  const res = await kcFetch('/linked-accounts')
  return res.json() as Promise<KcLinkedAccount[]>
}

export async function deleteKcLinkedAccount(providerAlias: string): Promise<void> {
  await kcFetch(`/linked-accounts/${providerAlias}`, { method: 'DELETE' })
}
