import { titleMetadata } from '@/lib/i18n-server'
import LoginPage from '@/features/auth/login-page'

export const generateMetadata = titleMetadata('signIn')

export default function Page() {
  return <LoginPage />
}
