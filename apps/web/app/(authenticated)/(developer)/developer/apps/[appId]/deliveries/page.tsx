'use client'

import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useDeliveries } from '@/features/developer/hooks/use-developer-apps'
import { WebhookDeliveryLog } from '@/features/developer/components/webhook-delivery-log'

export default function DeliveriesPage() {
  const { appId } = useParams<{ appId: string }>()
  const { t } = useTranslation('developer')
  const { data: deliveries, isLoading } = useDeliveries(appId)

  return (
    <div className="max-w-xl mx-auto px-6 py-10 flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[var(--text-heading)]">{t('deliveries.title')}</h1>

      {isLoading ? (
        <p className="text-sm text-[var(--text-secondary)]">{t('apps.loading')}</p>
      ) : (
        <div className="rounded-xl border border-[var(--border-subtle)]">
          <WebhookDeliveryLog deliveries={deliveries ?? []} />
        </div>
      )}
    </div>
  )
}
