import { type ReactNode } from 'react'
import { titleMetadata } from '@/lib/i18n-server'
import { SoulProjectLayoutClient } from './_soul-project-layout-client'

export const generateMetadata = titleMetadata('project')

export default function SoulProjectLayout({ children }: { children: ReactNode }) {
  return <SoulProjectLayoutClient>{children}</SoulProjectLayoutClient>
}
