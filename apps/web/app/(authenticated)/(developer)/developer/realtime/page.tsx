import type { Metadata } from 'next'
import { RealtimePage } from '@/features/developer/docs/realtime-page'

export const metadata: Metadata = {
  title: 'Real-time (SignalR) — Inktide Docs',
  description: 'Connect to the AudioHub via SignalR WebSocket to receive live audio, emotion, and viseme events.',
}

export default RealtimePage
