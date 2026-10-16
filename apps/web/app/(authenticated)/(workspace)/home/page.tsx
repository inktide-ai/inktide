import { titleMetadata } from '@/lib/i18n-server'
import HomePage from './_client'

export const generateMetadata = titleMetadata('dashboard')

export default function Page() {
  return <HomePage />
}
