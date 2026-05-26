import { apiFetch, jsonOrThrow } from './client'

export interface SubscriptionDto {
  plan: 'free' | 'starter' | 'pro'
  status: 'active' | 'trialing' | 'cancelled' | 'expired' | 'pastdue'
  provider: string | null
  periodEnd: string | null
}

export async function getSubscription(): Promise<SubscriptionDto> {
  const res = await apiFetch('/api/billing/subscription')
  return jsonOrThrow<SubscriptionDto>(res)
}

export async function createCheckout(plan: 'starter' | 'pro', returnUrl?: string): Promise<{ checkoutUrl: string }> {
  const res = await apiFetch('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan, returnUrl: returnUrl ?? window.location.href }),
  })
  return jsonOrThrow<{ checkoutUrl: string }>(res)
}

export async function createPortal(returnUrl?: string): Promise<{ portalUrl: string }> {
  const res = await apiFetch('/api/billing/portal', {
    method: 'POST',
    body: JSON.stringify({ returnUrl: returnUrl ?? window.location.href }),
  })
  return jsonOrThrow<{ portalUrl: string }>(res)
}
