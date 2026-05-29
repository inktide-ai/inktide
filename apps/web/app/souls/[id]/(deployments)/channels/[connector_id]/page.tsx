import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Channel Connector — Inktide' }
}

export { default } from '@/features/soul/channels/channel-connector-page'
