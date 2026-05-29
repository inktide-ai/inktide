import { type Metadata } from 'next'
import { ProjectPageClient } from './_project-page-client'

// Authenticated page: Keycloak tokens live in localStorage, not available server-side.
// Static metadata is sufficient — SEO is not critical for authenticated routes.
export function generateMetadata(): Metadata {
  return { title: 'Project' }
}

export default function Page() {
  return <ProjectPageClient />
}
