import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoadingScreen from './components/LoadingScreen'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

const LandingPage = lazy(() => import('./components/LandingPage'))
const LoginPage = lazy(() => import('./components/LoginPage'))
const RegisterPage = lazy(() => import('./components/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./components/ForgotPasswordPage'))
const AuthCallbackPage = lazy(() => import('./components/AuthCallbackPage'))
const ProfilePage = lazy(() => import('./components/ProfilePage'))
const CharacterEditPage = lazy(() => import('./components/ProfilePage/CharacterEditPage'))
const ObsScenePage = lazy(() => import('./pages/obs/ObsScenePage'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/bot/:cardId/edit"
            element={
              <ProtectedRoute>
                <CharacterEditPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          {/* No auth guard — OBS Browser Source has no Keycloak session */}
          <Route path="/obs/scene" element={<ObsScenePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
