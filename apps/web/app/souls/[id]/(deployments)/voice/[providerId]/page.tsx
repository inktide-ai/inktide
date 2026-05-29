import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Voice Provider — Inktide' }
}

export { default } from '@/features/soul/voice/voice-provider-settings'
