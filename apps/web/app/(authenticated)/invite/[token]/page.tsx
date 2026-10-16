import { titleMetadata } from '@/lib/i18n-server'
import AcceptInvitePage from './_client'

export const generateMetadata = titleMetadata('invite')

export default function Page() {
  return <AcceptInvitePage />
}
