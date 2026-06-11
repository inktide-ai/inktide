import { type ReactNode } from 'react'
import { Providers } from '@/app/_providers'

export default function OAuthLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>
}
