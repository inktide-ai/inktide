import { useState, useEffect } from 'react'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { keycloak, initOptions } from './keycloak'
import LoadingScreen from './components/LoadingScreen'

// Separate storage keys from the web app so that running both side-by-side
// (e.g. in dev) doesn't cause token cross-contamination.
const TOKEN_KEY = 'inktide_desktop_kc_token'
const REFRESH_KEY = 'inktide_desktop_kc_refresh'

export function DesktopBootstrap() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Persist tokens on auth events
    keycloak.onAuthSuccess = () => {
      if (keycloak.token) localStorage.setItem(TOKEN_KEY, keycloak.token)
      if (keycloak.refreshToken) localStorage.setItem(REFRESH_KEY, keycloak.refreshToken)
    }
    keycloak.onAuthRefreshSuccess = () => {
      if (keycloak.token) localStorage.setItem(TOKEN_KEY, keycloak.token)
      if (keycloak.refreshToken) localStorage.setItem(REFRESH_KEY, keycloak.refreshToken)
    }
    keycloak.onAuthLogout = () => {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
    }

    const cachedToken = localStorage.getItem(TOKEN_KEY)
    const cachedRefresh = localStorage.getItem(REFRESH_KEY)

    keycloak
      .init({
        ...initOptions,
        // When cached tokens exist, skip check-sso and restore session directly
        // from the stored tokens — avoids an unnecessary Keycloak round-trip.
        ...(cachedRefresh
          ? { onLoad: undefined, token: cachedToken ?? undefined, refreshToken: cachedRefresh }
          : {}),
      })
      .then(() => setReady(true))
      .catch(() => setReady(true))
  }, [])

  if (!ready) return <LoadingScreen />

  return (
    <AuthProvider keycloak={keycloak}>
      <App />
    </AuthProvider>
  )
}
