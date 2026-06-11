export const PLAN_LIMITS = {
  free:    { maxSoulCards: 3,        maxChannelsPerCard: 1 },
  starter: { maxSoulCards: 3,        maxChannelsPerCard: 2 },
  pro:     { maxSoulCards: Infinity, maxChannelsPerCard: Infinity },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS
