'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { PROVIDER_DEFS } from '@/lib/providers'
import { getCredentials, type CredentialResponse } from '../../../api/soul'
import { profileSettingsPath } from '@/lib/routes'

const PROVIDER_ICONS: Record<string, string> = {
  ollama:    '🦙',
  anthropic: '◆',
  deepseek:  '⚡',
}

export default function ProvidersPage() {
  const { t } = useTranslation(['providers'])
  const router = useRouter()
  const [credentials, setCredentials] = useState<CredentialResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCredentials()
      .then(setCredentials)
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false))
  }, [])

  const hasKey = (providerId: string) =>
    credentials.find((c) => c.providerId === providerId)?.hasKey ?? false

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      <div className="mb-[0.875rem] pb-[0.875rem] border-b border-white/[0.06]">
        <div className="text-[0.625rem] font-bold text-white/38 tracking-[0.09em] uppercase mb-[0.3rem]">{t('providers:page.title')}</div>
        <div className="text-[0.8125rem] text-white/50 leading-[1.55]">{t('providers:page.desc')}</div>
      </div>

      {loading ? (
        <div className="text-center py-16 px-8 text-(--text-muted)">
          <div className="inline-block w-6 h-6 border-2 border-(--border) border-t-(--accent-red) rounded-full animate-spin mb-4" />
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(195px,1fr))] gap-[0.375rem] mt-[0.875rem]">
          {PROVIDER_DEFS.map((def) => {
            const connected = !def.requiresKey || hasKey(def.id)
            return (
              <div
                key={def.id}
                className="relative bg-[#1e1f22] border border-[#2d2f33] border-l-2 border-l-transparent rounded-[8px] p-4 cursor-pointer transition-[background,border-color] duration-[120ms] ease flex flex-col min-h-[114px] overflow-hidden select-none outline-none hover:bg-[#26282e] hover:border-[#42454d] focus-visible:shadow-[0_0_0_2px_rgba(53,116,240,0.4)]"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`${profileSettingsPath('providers')}/${def.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    router.push(`${profileSettingsPath('providers')}/${def.id}`)
                }}
              >
                <div className="absolute top-[0.875rem] right-[0.875rem] text-[2.25rem] opacity-10 leading-none pointer-events-none">
                  {PROVIDER_ICONS[def.id] ?? '🔌'}
                </div>
                <div className="text-[0.8125rem] font-semibold text-(--text-primary) leading-[1.3]">{def.name}</div>
                <div className="text-[0.6875rem] text-white/38 leading-[1.45] mt-[0.2rem]">{def.description}</div>
                <div className="flex items-center justify-between mt-auto pt-[0.625rem]">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', connected ? 'bg-[#22c55e]' : 'bg-[rgba(148,163,184,0.35)]')} />
                  <span className="text-[0.6875rem] font-medium text-(--text-muted) font-[var(--font-ui)]">
                    {connected ? t('providers:status.connected') : t('providers:status.notConnected')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
