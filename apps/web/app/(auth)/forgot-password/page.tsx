import type { Metadata } from 'next'
import ForgotPasswordPage from './_client'

export const metadata: Metadata = { title: 'Reset Password — Inktide' }

export default function Page() {
  return <ForgotPasswordPage />
}
