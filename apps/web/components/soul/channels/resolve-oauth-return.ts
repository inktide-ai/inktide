const OAUTH_TTL_MS = 10 * 60 * 1000 // 10 minutes

export interface OAuthPendingState {
  soulId: string
  connectorId: string
  initiatedAt: number
}

// Unique key per connector+soul prevents cross-connector collision and simplifies cleanup.
export const oauthPendingKey = (connectorId: string, soulId: string) =>
  `v1_inktide_oauth_pending:${connectorId}:${soulId}`

export function saveOAuthPending(state: OAuthPendingState): void {
  sessionStorage.setItem(
    oauthPendingKey(state.connectorId, state.soulId),
    JSON.stringify(state),
  )
}

// Known limitation: sessionStorage is not shared across tabs.
// If the OAuth provider opens the callback in a new tab,
// justConnected will be false and the success banner won't show.
// This is an accepted trade-off — all known providers redirect to the originating tab.
//
// The key is NOT removed here; removal is a side effect and belongs in useEffect.
// Natural lifecycle: tab close clears sessionStorage; TTL prevents stale banners;
// a new OAuth flow overwrites the key.
export function resolveOAuthReturn(
  searchParams: URLSearchParams,
  soulId: string,
  connectorId: string,
): boolean {
  if (searchParams.get('connected') !== 'true') return false
  try {
    const raw = sessionStorage.getItem(oauthPendingKey(connectorId, soulId))
    if (!raw) return false
    const p: Partial<OAuthPendingState> = JSON.parse(raw)
    return (
      p.soulId === soulId &&
      p.connectorId === connectorId &&
      typeof p.initiatedAt === 'number' &&
      Date.now() - p.initiatedAt < OAUTH_TTL_MS
    )
  } catch {
    return false
  }
}
