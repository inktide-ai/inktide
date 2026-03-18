import Keycloak from 'keycloak-js'

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080'
const realm = import.meta.env.VITE_KEYCLOAK_REALM ?? 'chimera'
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'chimera-web'

export const keycloak = new Keycloak({
  url: keycloakUrl,
  realm,
  clientId,
})

export const keycloakInitOptions = {
  onLoad: 'check-sso' as const,
  checkLoginIframe: false,
}
