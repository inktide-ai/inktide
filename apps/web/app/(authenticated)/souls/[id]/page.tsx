import { titleMetadata } from '@/lib/i18n-server'
import { SoulPageClient } from './_soul-page-client'

export const generateMetadata = titleMetadata('character')

export default function Page() {
  return <SoulPageClient />
}
