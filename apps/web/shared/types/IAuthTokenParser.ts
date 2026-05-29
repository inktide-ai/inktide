import type { KeycloakTokenParsed } from 'keycloak-js'
import type { UserInfo } from '@/shared/services/auth/AuthContext'

/** SRP: единственная ответственность — извлечение данных пользователя из JWT-токена. */
export interface IAuthTokenParser {
  parse(token: KeycloakTokenParsed): UserInfo | null
  extractNickname(token: KeycloakTokenParsed, storedNickname: string | null): string | null
}
