/**
 * Returns a SignalR access token for /hubs/audio.
 *
 * Uses the ws-ticket system: POST /api/auth/ws-ticket -> Redis ticket (30 s TTL).
 * The backend's OnMessageReceived handler (AuthStartup.cs) validates the ticket
 * via StringGetDeleteAsync - single-use, atomic.
 *
 * If ws-ticket returns non-OK, SignalR will fail with 401 - the middleware
 * guards protected routes and will redirect to /login on next navigation.
 */
export async function getSignalRToken(): Promise<string> {
  const res = await fetch('/api/auth/ws-ticket', { method: 'POST' })
  if (!res.ok) {
    console.warn('[getSignalRToken] ws-ticket returned', res.status, '— SignalR will fail')
    return ''
  }
  const data = await res.json() as { ticket?: string }
  return data.ticket ?? ''
}
