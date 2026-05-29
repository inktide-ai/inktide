'use client'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSubscription, createCheckout, createPortal, type SubscriptionDto } from '@/entities/billing/api/billing'
import { queryKeys } from '@/shared/lib/query/keys'
import { useAuth } from '@/shared/services/auth'

interface BillingContextValue {
  plan: 'free' | 'starter' | 'pro'
  status: SubscriptionDto['status']
  periodEnd: Date | null
  isLoading: boolean
  openCheckout: (plan: 'starter' | 'pro') => Promise<void>
  openPortal: () => Promise<void>
  refresh: () => Promise<void>
}

const BillingContext = createContext<BillingContextValue | null>(null)

const FREE_SUB: SubscriptionDto = { plan: 'free', status: 'active', provider: null, periodEnd: null }

export function BillingProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth()

  const { data: sub = FREE_SUB, isLoading, refetch } = useQuery({
    queryKey: queryKeys.billing.subscription,
    queryFn: getSubscription,
    enabled: isLoggedIn,
    placeholderData: FREE_SUB,
  })

  const checkoutMutation = useMutation({ mutationFn: ({ plan }: { plan: 'starter' | 'pro' }) => createCheckout(plan) })
  const portalMutation   = useMutation({ mutationFn: createPortal })

  const openCheckout = useCallback(async (plan: 'starter' | 'pro') => {
    const { checkoutUrl } = await checkoutMutation.mutateAsync({ plan })
    if (!checkoutUrl) throw new Error('No checkout URL returned')
    window.location.href = checkoutUrl
  }, [checkoutMutation])

  const openPortal = useCallback(async () => {
    const { portalUrl } = await portalMutation.mutateAsync(undefined)
    if (!portalUrl) throw new Error('No portal URL returned')
    window.location.href = portalUrl
  }, [portalMutation])

  const refresh = useCallback(async () => { await refetch() }, [refetch])

  const value = useMemo<BillingContextValue>(() => ({
    plan: sub.plan,
    status: sub.status,
    periodEnd: sub.periodEnd ? new Date(sub.periodEnd) : null,
    isLoading,
    openCheckout,
    openPortal,
    refresh,
  }), [sub, isLoading, openCheckout, openPortal, refresh])

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
}

export function useBilling() {
  const ctx = useContext(BillingContext)
  if (!ctx) throw new Error('useBilling must be used within BillingProvider')
  return ctx
}
