export type PlanKey = 'starter' | 'pro'

// Feature lists live in landing.json (pricing.<plan>.features) so pricing and checkout show the same text.
export interface PlanMeta {
  name: string
  accentColor: string
}

export const PLANS: Record<PlanKey, PlanMeta> = {
  starter: {
    name: 'Starter',
    accentColor: '#FF6A2B',
  },
  pro: {
    name: 'Pro',
    accentColor: '#7B61FF',
  },
}
