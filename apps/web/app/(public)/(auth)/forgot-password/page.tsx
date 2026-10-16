import { titleMetadata } from '@/lib/i18n-server'
import ForgotPasswordPage from './_client'

export const generateMetadata = titleMetadata('resetPassword')

export default function Page() {
  return <ForgotPasswordPage />
}
