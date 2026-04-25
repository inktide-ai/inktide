/**
 * Platform detection and native capability wrappers.
 *
 * All Tauri plugin imports are dynamic so the web bundle never pulls them in,
 * and tree-shaking keeps production bundles lean on both targets.
 */

/** True when running inside a Tauri WebView. */
export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/**
 * Open a URL in the system default browser.
 * - Tauri: uses the shell plugin (no new WebView, opens OS browser).
 * - Web: falls back to window.open.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open(url)
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

/**
 * Show a native OS notification.
 * - Tauri: uses the notification plugin with permission flow.
 * - Web: uses the browser Notification API.
 */
export async function notify(title: string, body: string): Promise<void> {
  if (isTauri()) {
    const { isPermissionGranted, requestPermission, sendNotification } =
      await import('@tauri-apps/plugin-notification')
    let granted = await isPermissionGranted()
    if (!granted) {
      const result = await requestPermission()
      granted = result === 'granted'
    }
    if (granted) sendNotification({ title, body })
  } else if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body })
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') new Notification(title, { body })
    }
  }
}

/**
 * Return the running app version.
 * - Tauri: reads from Cargo.toml via the app plugin.
 * - Web: reads VITE_APP_VERSION or returns 'web'.
 */
export async function getAppVersion(): Promise<string> {
  if (isTauri()) {
    const { getVersion } = await import('@tauri-apps/api/app')
    return getVersion()
  }
  return import.meta.env.VITE_APP_VERSION ?? 'web'
}

/**
 * Listen for deep-link URL events (desktop only).
 * Used for OAuth callback: inktide://auth/callback?code=...
 * Returns an unsubscribe function.
 */
export async function onDeepLink(
  handler: (urls: string[]) => void,
): Promise<() => void> {
  if (!isTauri()) return () => {}
  const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link')
  return onOpenUrl(handler)
}
