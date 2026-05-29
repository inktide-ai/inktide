import type { Metadata } from 'next'
import LandingPage from '@/features/landing/landing-page'

export const metadata: Metadata = {
  title: 'Inktide — AI Streaming Platform',
  description: 'Give your AI character a voice. Real-time, sub-1.3s latency.',
}

export default function Home() {
  return <LandingPage />
}
