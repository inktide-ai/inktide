import ReactDOM from 'react-dom/client'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { keycloak, initOptions } from './keycloak'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={initOptions}
  >
    <AuthProvider>
      <App />
    </AuthProvider>
  </ReactKeycloakProvider>,
)
