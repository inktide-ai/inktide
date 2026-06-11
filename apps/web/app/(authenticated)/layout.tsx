import { type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Providers } from '@/app/_providers'

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.error === 'RefreshTokenError') redirect('/login')
  return <Providers>{children}</Providers>
}
