import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { keycloak } = useKeycloak()
  const location = useLocation()

  if (!keycloak.authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
