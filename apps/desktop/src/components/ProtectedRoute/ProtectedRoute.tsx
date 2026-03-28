import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../LoadingScreen'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoggedIn, isInitialized } = useAuth()
  const location = useLocation()

  if (!isInitialized) return <LoadingScreen />
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />

  return <>{children}</>
}

export default ProtectedRoute
