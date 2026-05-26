import type { KeycloakTokenParsed } from 'keycloak-js'
import type { IAuthTokenParser } from '@/types/IAuthTokenParser'
import type { UserInfo } from '../../context/AuthContext'
import { readStoredNickname } from '../../utils/profileStorage'

const IGNORED_ROLES = new Set(['offline_access', 'uma_authorization'])

/** SRP: единственная ответственность — извлечение UserInfo из Keycloak JWT-токена. */
export class KeycloakTokenParser implements IAuthTokenParser {
  parse(token: KeycloakTokenParsed): UserInfo | null {
    if (!token.sub) return null
    const userName = (token.preferred_username as string) ?? token.sub
    const rawRoles = (token.realm_access as { roles?: string[] })?.roles ?? []
    const meaningful = rawRoles.filter(
      (r) => !IGNORED_ROLES.has(r) && !r.startsWith('default-roles-'),
    )
    const role = meaningful.includes('admin') ? 'admin' : meaningful[0] ?? 'user'
    const pic = (token.picture as string | undefined)?.trim() || null
    return { userId: token.sub, userName, role, pictureUrl: pic }
  }

  extractNickname(token: KeycloakTokenParsed, storedNickname: string | null): string | null {
    const stored = storedNickname ?? (token.sub ? readStoredNickname(token.sub) : null)
    const fromToken =
      typeof token.nickname === 'string' ? token.nickname.trim().slice(0, 32) || null : null
    return stored ?? fromToken ?? null
  }
}
