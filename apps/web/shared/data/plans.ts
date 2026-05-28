export type PlanKey = 'starter' | 'pro'

export interface PlanMeta {
  name: string
  monthlyPrice: number
  yearlyPrice: number
  yearlyTotal: number
  features: string[]
  accentColor: string
}

export const PLANS: Record<PlanKey, PlanMeta> = {
  starter: {
    name: 'Starter',
    monthlyPrice: 16,
    yearlyPrice: 12,
    yearlyTotal: 144,
    features: [
      '3 Soul Cards',
      'Discord + Twitch connectors',
      'All TTS voices',
      'Memory & RAG (chat history)',
      'Priority support',
    ],
    accentColor: '#FF6A2B',
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 30,
    yearlyPrice: 24,
    yearlyTotal: 288,
    features: [
      'Unlimited Soul Cards',
      'All platforms + future connectors',
      'Custom TTS API key',
      'Full RAG & unlimited memory',
      'API access',
      'Priority queue (less latency)',
    ],
    accentColor: '#7B61FF',
  },
}
