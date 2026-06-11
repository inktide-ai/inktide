import NextAuth from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'

const KC_URL        = process.env.NEXT_PUBLIC_KEYCLOAK_URL        ?? 'http://localhost:8080'
const KC_REALM      = process.env.NEXT_PUBLIC_KEYCLOAK_REALM      ?? 'chimera'
const CLIENT_ID     = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID  ?? 'chimera-web'
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET          ?? ''

type KcTokens = { access_token: string; refresh_token: string; expires_in: number }

async function refreshAccessToken(refreshToken: string): Promise<KcTokens | null> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), 6_000)
  try {
    const res = await fetch(
      `${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'refresh_token',
          client_id:     CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
        }),
        signal: abort.signal,
      },
    )
    if (!res.ok) return null
    return res.json() as Promise<KcTokens>
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Deduplicates concurrent refresh calls for the same user.
// Without this, N parallel BFF requests in the refresh window each hit Keycloak separately.
const refreshCache = new Map<string, Promise<KcTokens | null>>()

function refreshWithDedup(userId: string, refreshToken: string): Promise<KcTokens | null> {
  if (!refreshCache.has(userId)) {
    const p = refreshAccessToken(refreshToken).finally(() => refreshCache.delete(userId))
    refreshCache.set(userId, p)
  }
  return refreshCache.get(userId)!
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [
    Keycloak({
      clientId:     CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      issuer:       `${KC_URL}/realms/${KC_REALM}`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial login — persist tokens and user claims
      if (account) {
        // Keycloak access token may carry a different sub than the ID token
        // (e.g. pairwise subject identifiers). Decode without verification —
        // we only need the sub to build channelIds on the frontend.
        let backendUserId: string | undefined
        try {
          const payload = JSON.parse(
            Buffer.from(account.access_token!.split('.')[1], 'base64url').toString(),
          ) as { sub?: string }
          backendUserId = payload.sub
        } catch { /* ignore — falls back to token.sub */ }

        return {
          ...token,
          accessToken:   account.access_token!,
          refreshToken:  account.refresh_token!,
          expiresAt:     (account.expires_at ?? 0) * 1000,
          roles:         (profile as { realm_access?: { roles?: string[] } })?.realm_access?.roles ?? [],
          nickname:      (profile as { nickname?: string })?.nickname ?? null,
          locale:        (profile as { locale?: string })?.locale,
          backendUserId,
        }
      }

      // Token still valid (with 2-minute buffer — refresh early to avoid hitting expiry under load)
      if (Date.now() < (token.expiresAt as number) - 120_000) return token

      // Refresh expired token — deduplicated across concurrent BFF requests
      const tokens = await refreshWithDedup(token.sub!, token.refreshToken as string)
      if (!tokens) return { ...token, error: 'RefreshTokenError' as const }

      return {
        ...token,
        accessToken:  tokens.access_token,
        refreshToken: tokens.refresh_token ?? token.refreshToken,
        expiresAt:    Date.now() + tokens.expires_in * 1000,
        error:        undefined,
      }
    },

    session({ session, token }) {
      session.user.userId      = (token.backendUserId ?? token.sub)!
      session.user.accessToken = token.accessToken as string
      session.user.expiresAt   = token.expiresAt   as number
      session.user.roles       = token.roles        as string[]
      session.user.nickname    = token.nickname     as string | null
      session.user.locale      = token.locale       as string | undefined
      if (token.error) session.error = token.error as string
      return session
    },
  },
})
