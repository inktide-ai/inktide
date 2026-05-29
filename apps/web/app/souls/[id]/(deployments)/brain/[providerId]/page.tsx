import type { Metadata } from 'next'
import BrainProviderPage from './_client'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'LLM Provider Settings — Inktide' }
}

export default BrainProviderPage
