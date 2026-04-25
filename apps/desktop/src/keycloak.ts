import Keycloak from 'keycloak-js'
import { isTauri } from './platform'

const OIDC_AUTH_PATH = '/protocol/openid-connect/auth'
const OIDC_FORGOT_CREDENTIALS_PATH = '/protocol/openid-connect/forgot-credentials'

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

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'inktide',
  // Use a dedicated Keycloak client with allowed redirect URIs:
  //   http://localhost:3001/*   ← dev (Vite)
  //   tauri://localhost/*       ← production Tauri WebView
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'inktide-desktop',
})

export const initOptions = {
  onLoad: 'check-sso' as const,
  flow: 'standard' as const,
  pkceMethod: 'S256' as const,
  // Tauri WebView sandboxes iframes — silent SSO relies on a hidden iframe
  // and will never resolve. Disable it on desktop; Keycloak will fall back
  // to a full redirect for session restoration.
  ...(!isTauri() && {
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  }),
  checkLoginIframe: false,
}
