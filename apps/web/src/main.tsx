import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { keycloak, initOptions } from './keycloak'
import { configureApiAuth } from './api/client'
import LoadingScreen from './components/LoadingScreen'
import './index.css'

const TOKEN_KEY = 'chimera_kc_token'
const REFRESH_KEY = 'chimera_kc_refresh'

function WebBootstrap() {
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

    configureApiAuth({
      getToken: () => keycloak.token,
      isAuthenticated: () => !!keycloak.authenticated,
      refreshToken: () => keycloak.updateToken(30).then(Boolean).catch(() => false),
    })

    keycloak
      .init({
        ...initOptions,
        // When cached tokens exist, skip check-sso (which needs an SSO cookie) and
        // let keycloak-js restore the session directly from the stored tokens.
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

ReactDOM.createRoot(document.getElementById('root')!).render(<WebBootstrap />)
