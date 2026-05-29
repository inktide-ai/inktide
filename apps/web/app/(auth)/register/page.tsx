import type { Metadata } from 'next'
import RegisterPage from '@/features/auth/register-page'

export const metadata: Metadata = { title: 'Create Account — Inktide' }

export default function Page() {
  return <RegisterPage />
}
