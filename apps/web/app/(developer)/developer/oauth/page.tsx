import type { Metadata } from 'next'
import { OAuthPage } from '@/features/developer/docs/oauth-page'

export const metadata: Metadata = {
  title: 'OAuth 2.0 — Inktide Docs',
  description: 'Authorization Code + PKCE flow via Keycloak, scopes, and token exchange.',
}

export default OAuthPage
