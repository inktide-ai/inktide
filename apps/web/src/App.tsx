import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import LoadingScreen from './components/LoadingScreen'
import ProtectedRoute from './components/ProtectedRoute'
import { CharactersProvider } from './context/CharactersContext'
import { ThemeProvider } from './context/ThemeContext'
import ProfileShell from './layouts/ProfileShell/ProfileShell'
import ProfileSettingsSectionLayout from './layouts/ProfileSettingsSectionLayout/ProfileSettingsSectionLayout'
import './App.css'

const LandingPage        = lazy(() => import('./components/LandingPage'))
const LoginPage          = lazy(() => import('./components/LoginPage'))
const RegisterPage       = lazy(() => import('./components/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./components/ForgotPasswordPage'))
const AuthCallbackPage   = lazy(() => import('./components/AuthCallbackPage'))
const CharacterEditPage  = lazy(() => import('./components/ProfilePage/CharacterEditPage'))
const ObsScenePage       = lazy(() => import('./pages/obs/ObsScenePage'))

const DashboardPage    = lazy(() => import('./pages/DashboardPage/DashboardPage'))
const SettingsHubPage  = lazy(() => import('./pages/profile/SettingsHubPage'))
const IdentityPage     = lazy(() => import('./pages/profile/settings/IdentityPage'))
const SkillsPage       = lazy(() => import('./pages/profile/settings/SkillsPage'))
const ModelPage        = lazy(() => import('./pages/profile/settings/ModelPage'))
const ScenePage        = lazy(() => import('./pages/profile/settings/ScenePage'))
const SceneDetailPage  = lazy(() => import('./pages/profile/settings/SceneDetailPage'))
const MemoryPage       = lazy(() => import('./pages/profile/settings/MemoryPage'))
const BrainPage        = lazy(() => import('./pages/profile/settings/BrainPage'))
const VoicePage        = lazy(() => import('./pages/profile/settings/VoicePage'))
const IntegrationsPage    = lazy(() => import('./pages/profile/settings/IntegrationsPage'))
const ObsPage             = lazy(() => import('./pages/profile/settings/ObsPage'))
const BackupPage          = lazy(() => import('./pages/profile/settings/BackupPage'))
const AccountPage         = lazy(() => import('./pages/profile/settings/AccountPage'))
const UserAccountPage     = lazy(() => import('./pages/profile/UserAccountPage'))

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/obs/scene" element={<ObsScenePage />} />

            <Route
              element={
                <ProtectedRoute>
                  <CharactersProvider>
                    <ProfileShell />
                  </CharactersProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/home" element={<DashboardPage />} />
              <Route path="/home/bot/:cardId/edit" element={<CharacterEditPage />} />

              <Route path="/settings" element={<Outlet />}>
                <Route index element={<SettingsHubPage />} />
                <Route path="me" element={<AccountPage />} />
              <Route path="me/account" element={<UserAccountPage />} />
                <Route element={<ProfileSettingsSectionLayout />}>
                  <Route path="identity"     element={<IdentityPage />} />
                  <Route path="skills"       element={<SkillsPage />} />
                  <Route path="model"        element={<ModelPage />} />
                  <Route path="scene"              element={<ScenePage />} />
                  <Route path="scene/:sceneId"    element={<SceneDetailPage />} />
                  <Route path="memory"            element={<MemoryPage />} />
                  <Route path="brain"             element={<BrainPage />} />
                  <Route path="brain/:providerId" element={<BrainPage />} />
                  <Route path="voice"             element={<VoicePage />} />
                  <Route path="voice/:providerId" element={<VoicePage />} />
                  <Route path="integrations"              element={<IntegrationsPage />} />
                  <Route path="obs"                       element={<ObsPage />} />
                  <Route path="backup"                    element={<BackupPage />} />
                  <Route path="providers"                 element={<Navigate to="/settings/brain" replace />} />
                  <Route path="providers/:providerId"     element={<Navigate to="/settings/brain" replace />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
