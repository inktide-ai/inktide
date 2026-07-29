// RFC-1918, loopback, link-local, and known private IPv6 ranges.
const PRIVATE_HOST_RE = /^(localhost$|127\.|0\.0\.0\.0|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i

// Internal TLD suffixes used in mDNS (.local), GCP/k8s (.internal, .cluster.local),
// and corporate networks (.corp, .lan, .home, .intranet).
const INTERNAL_TLD_RE = /\.(local|internal|localhost|localdomain|cluster\.local|corp|lan|home|intranet)$/i

const BLOCKED_HOST_MSG = 'Private, loopback, and internal addresses are not allowed for remote providers.'

/**
 * Returns true when hostname must never receive outbound requests.
 * Covers: RFC-1918 IPs, loopback, link-local, IPv6 private ranges,
 * single-label names (Docker/k8s service names), and internal TLD suffixes.
 */
function isBlockedHost(hostname: string): boolean {
  if (PRIVATE_HOST_RE.test(hostname)) return true
  // Single-label hostnames resolve inside a private namespace (Docker: "redis", "postgres"; k8s pod names).
  if (!hostname.includes('.')) return true
  return INTERNAL_TLD_RE.test(hostname)
}

export function validateProviderUrl(raw: string): string | null {
  let url: URL
  try { url = new URL(raw) } catch { return 'Invalid URL.' }
  if (url.protocol !== 'https:' && url.protocol !== 'http:')
    return 'URL must use http or https.'
  if (isBlockedHost(url.hostname))
    return BLOCKED_HOST_MSG
  return null
}

export async function pingOllama(baseUrl: string): Promise<string | null> {
  // Ollama intentionally runs on localhost - no SSRF guard here.
  try {
    const url = baseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '')
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(4000) })
    if (res.ok) return null
    return `Server returned ${res.status}`
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('cors'))
      return 'Failed to reach Ollama. This is likely a CORS issue.\nLaunch Ollama with:\n  OLLAMA_ORIGINS=* ollama serve'
    return `Cannot reach ${baseUrl}. Check the URL and that Ollama is running.`
  }
}

export async function pingRemote(baseUrl: string, apiKey: string): Promise<string | null> {
  if (!apiKey.trim()) return 'API key is required.'

  // SSRF guard: parse the URL and reject private/internal hosts before any network request.
  // This must happen before validateProviderUrl so the error is fail-closed even if
  // validateProviderUrl's logic changes in the future.
  let parsed: URL
  try { parsed = new URL(baseUrl) } catch { return 'Invalid URL.' }
  if (isBlockedHost(parsed.hostname)) return BLOCKED_HOST_MSG

  const urlError = validateProviderUrl(baseUrl)
  if (urlError) return urlError

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok || res.status === 401) return null
    return `Server returned ${res.status}`
  } catch {
    return `Cannot reach ${baseUrl}. Check the URL and your network.`
  }
}
