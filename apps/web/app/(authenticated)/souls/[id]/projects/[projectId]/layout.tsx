import { type ReactNode } from 'react'
import { SoulProjectLayoutClient } from './_soul-project-layout-client'

// Next.js 15+: params is a Promise - must be awaited
export async function generateMetadata({ params }: { params: Promise<{ id: string; projectId: string }> }) {
  const { projectId } = await params
  return { title: `Project ${projectId.slice(0, 8)}` }
}

export default function SoulProjectLayout({ children }: { children: ReactNode }) {
  return <SoulProjectLayoutClient>{children}</SoulProjectLayoutClient>
}
