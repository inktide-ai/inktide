import { type ReactNode } from 'react'
import { PublicProviders } from '@/app/_public-providers'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicProviders>{children}</PublicProviders>
}
