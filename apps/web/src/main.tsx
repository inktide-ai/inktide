import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/i18n'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { keycloak, initOptions } from './keycloak'
import { configureApiAuth } from './api/client'
import LoadingScreen from './components/LoadingScreen'
import { KeycloakTokenParser } from './services/auth/KeycloakTokenParser'
import { KeycloakLocaleSync } from './services/auth/KeycloakLocaleSync'
import { MeAvatarService } from './services/auth/MeAvatarService'
import './index.css'

const TOKEN_KEY   = 'inktide_kc_token'
const REFRESH_KEY = 'inktide_kc_refresh'

// ── Composition Root ──────────────────────────────────────────────────────────
//
// DIP: конкретные реализации создаются здесь и передаются через props/DI.
// AuthProvider зависит от интерфейсов — здесь мы "связываем" интерфейсы с классами.

const tokenParser  = new KeycloakTokenParser()
const localeSync   = new KeycloakLocaleSync()
const avatarService = new MeAvatarService()

function WebBootstrap() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    keycloak.onAuthSuccess = () => {
      if (keycloak.token)        localStorage.setItem(TOKEN_KEY, keycloak.token)
      if (keycloak.refreshToken) localStorage.setItem(REFRESH_KEY, keycloak.refreshToken)
    }
    keycloak.onAuthRefreshSuccess = () => {
      if (keycloak.token)        localStorage.setItem(TOKEN_KEY, keycloak.token)
      if (keycloak.refreshToken) localStorage.setItem(REFRESH_KEY, keycloak.refreshToken)
    }
    keycloak.onAuthLogout = () => {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
    }

    const cachedToken   = localStorage.getItem(TOKEN_KEY)
    const cachedRefresh = localStorage.getItem(REFRESH_KEY)

    configureApiAuth({
      getToken:       () => keycloak.token,
      isAuthenticated: () => !!keycloak.authenticated,
      refreshToken:   () => keycloak.updateToken(30).then(Boolean).catch(() => false),
    })

    keycloak
      .init({
        ...initOptions,
        ...(cachedRefresh
          ? { onLoad: undefined, token: cachedToken ?? undefined, refreshToken: cachedRefresh }
          : {}),
      })
      .then(() => setReady(true))
      .catch(() => setReady(true))
  }, [])

  if (!ready) return <LoadingScreen />

  return (
    <AuthProvider
      keycloak={keycloak}
      tokenParser={tokenParser}
      localeSync={localeSync}
      avatarService={avatarService}
    >
      <App />
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<WebBootstrap />)
