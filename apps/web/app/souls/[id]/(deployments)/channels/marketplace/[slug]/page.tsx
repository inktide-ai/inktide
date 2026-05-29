import type { Metadata } from 'next'
import MarketplacePage from './_client'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Channel Marketplace — Inktide' }
}

export default MarketplacePage
