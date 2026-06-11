import type { Metadata } from 'next'
import CheckoutPage from './_client'

export const metadata: Metadata = { title: 'Checkout — Inktide' }

export default function Page() {
  return <CheckoutPage />
}
