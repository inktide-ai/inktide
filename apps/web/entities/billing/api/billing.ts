import { apiFetch, jsonOrThrow } from '@/api/client'

export interface SubscriptionDto {
  plan: 'free' | 'starter' | 'pro'
  status: 'active' | 'trialing' | 'cancelled' | 'expired' | 'pastdue'
  provider: string | null
  periodEnd: string | null
}

/** Monthly price of a paid plan, exactly as checkout charges it. */
export interface PlanPriceDto {
  plan: 'starter' | 'pro'
  amount: number
  currency: string
}

export async function getPlanPrices(): Promise<PlanPriceDto[]> {
  const res = await apiFetch('/api/v1/billing/plans')
  return jsonOrThrow<PlanPriceDto[]>(res)
}

export async function getSubscription(): Promise<SubscriptionDto> {
  const res = await apiFetch('/api/v1/billing/subscription')
  return jsonOrThrow<SubscriptionDto>(res)
}

export async function createCheckout(plan: 'starter' | 'pro', returnUrl?: string): Promise<{ checkoutUrl: string }> {
  const res = await apiFetch('/api/v1/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan, returnUrl: returnUrl ?? window.location.href }),
  })
  return jsonOrThrow<{ checkoutUrl: string }>(res)
}

export async function createPortal(returnUrl?: string): Promise<{ portalUrl: string }> {
  const res = await apiFetch('/api/v1/billing/portal', {
    method: 'POST',
    body: JSON.stringify({ returnUrl: returnUrl ?? window.location.href }),
  })
  return jsonOrThrow<{ portalUrl: string }>(res)
}
