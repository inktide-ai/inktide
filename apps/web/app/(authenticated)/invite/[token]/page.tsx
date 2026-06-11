import type { Metadata } from 'next'
import AcceptInvitePage from './_client'

export const metadata: Metadata = { title: "You're invited — Inktide" }

export default function Page() {
  return <AcceptInvitePage />
}
