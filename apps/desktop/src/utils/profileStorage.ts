/** Local profile prefs until Keycloak / API own nickname. */

const key = (userId: string) => `chimera.profile.nickname.${userId}`

const MAX_LEN = 32

export function readStoredNickname(userId: string): string | null {
  try {
    const v = localStorage.getItem(key(userId))
    if (v == null) return null
    const t = v.trim()
    return t ? t.slice(0, MAX_LEN) : null
  } catch {
    return null
  }
}

export function writeStoredNickname(userId: string, value: string | null): void {
  try {
    const t = value?.trim().slice(0, MAX_LEN) ?? ''
    if (!t) localStorage.removeItem(key(userId))
    else localStorage.setItem(key(userId), t)
  } catch {
    /* ignore quota / private mode */
  }
}

export { MAX_LEN as MAX_NICKNAME_LEN }
