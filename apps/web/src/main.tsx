import ReactDOM from 'react-dom/client'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { keycloak, keycloakInitOptions } from './keycloak'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={keycloakInitOptions}
  >
    <AuthProvider>
      <App />
    </AuthProvider>
  </ReactKeycloakProvider>,
)
