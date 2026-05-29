import { type Metadata } from 'next'
import { SoulPageClient } from './_soul-page-client'

// Authenticated page: Keycloak tokens live in localStorage, not available server-side.
// Static metadata is sufficient — SEO is not critical for authenticated routes.
export function generateMetadata(): Metadata {
  return { title: 'Soul' }
}

export default function Page() {
  return <SoulPageClient />
}
