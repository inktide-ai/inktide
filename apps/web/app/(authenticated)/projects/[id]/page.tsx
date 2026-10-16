import { titleMetadata } from '@/lib/i18n-server'
import { ProjectPageClient } from './_project-page-client'

export const generateMetadata = titleMetadata('project')

export default function Page() {
  return <ProjectPageClient />
}
