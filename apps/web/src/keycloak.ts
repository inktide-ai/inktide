import Keycloak from 'keycloak-js'

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'chimera',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'chimera-web',
})

export const initOptions = {
  onLoad: 'check-sso' as const,
  flow: 'standard' as const,
  pkceMethod: 'S256' as const,
  silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  checkLoginIframe: false,
}
