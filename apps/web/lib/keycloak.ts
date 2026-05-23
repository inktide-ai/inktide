import Keycloak from 'keycloak-js'

const OIDC_AUTH_PATH = '/protocol/openid-connect/auth'
const OIDC_FORGOT_CREDENTIALS_PATH = '/protocol/openid-connect/forgot-credentials'

/** Env-backed defaults — single source of truth for Providers and Keycloak Account API URL helpers. */
export const keycloakEnvConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'inktide-app',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'inktide-web',
} as const

/**
 * One browser-side Keycloak instance for the app. Initialized in `KeycloakBootstrap`; never `new Keycloak()` elsewhere.
 */
export const keycloak = new Keycloak({
  url: keycloakEnvConfig.url,
  realm: keycloakEnvConfig.realm,
  clientId: keycloakEnvConfig.clientId,
})

/**
 * Builds the OIDC "forgot credentials" URL (same query params as login, but reset-credentials flow).
 * See Keycloak server admin: "Registration or Reset credentials requested by client".
 */
export async function createForgotCredentialsLoginUrl(
  kc: Keycloak,
  redirectUri: string
): Promise<string> {
  const loginUrl = await kc.createLoginUrl({ redirectUri })
  if (!loginUrl.includes(OIDC_AUTH_PATH)) {
    console.warn(
      '[Keycloak] Authorization URL shape changed; open forgot-password manually from the login screen.'
    )
    return loginUrl
  }
  return loginUrl.replace(OIDC_AUTH_PATH, OIDC_FORGOT_CREDENTIALS_PATH)
}
