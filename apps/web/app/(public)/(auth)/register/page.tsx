import { titleMetadata } from '@/lib/i18n-server'
import RegisterPage from '@/features/auth/register-page'

export const generateMetadata = titleMetadata('register')

export default function Page() {
  return <RegisterPage />
}
