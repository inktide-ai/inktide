/** Env-backed defaults - single source of truth for keycloak-account.ts URL helpers. */
export const keycloakEnvConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'inktide-app',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'inktide-web',
} as const
