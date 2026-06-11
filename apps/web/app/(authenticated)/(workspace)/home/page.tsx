import type { Metadata } from 'next'
import HomePage from './_client'

export const metadata: Metadata = { title: 'Dashboard — Inktide' }

export default function Page() {
  return <HomePage />
}
