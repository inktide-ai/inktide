import { titleMetadata } from '@/lib/i18n-server'
import CheckoutPage from './_client'

export const generateMetadata = titleMetadata('checkout')

export default function Page() {
  return <CheckoutPage />
}
