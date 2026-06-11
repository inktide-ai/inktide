import type { Metadata } from 'next'
import { WebhooksPage } from '@/features/developer/docs/webhooks-page'

export const metadata: Metadata = {
  title: 'Webhooks — Inktide Docs',
  description: 'Event types, signed payloads, and HMAC signature verification.',
}

export default WebhooksPage
