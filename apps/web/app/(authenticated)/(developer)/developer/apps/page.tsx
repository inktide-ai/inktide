'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { AppCard } from '@/features/developer/components/app-card'
import { useMyApps, useDeleteApp } from '@/features/developer/hooks/use-developer-apps'
import Link from 'next/link'

export default function MyAppsPage() {
  const router = useRouter()
  const { t } = useTranslation('developer')
  const { data: apps, isLoading } = useMyApps()
  const deleteApp = useDeleteApp()

  async function handleDelete(id: string) {
    if (!confirm(t('apps.deleteConfirm'))) return
    await deleteApp.mutateAsync(id)
  }

  return (
    <div className="mx-auto max-w-[1300px] px-6 py-10 flex flex-col gap-10">

      {/* Hero */}
      <section className="flex flex-col-reverse items-center gap-8 sm:flex-row sm:items-center sm:gap-12">
        <div className="flex-1">
          <span className="text-xs font-medium text-[var(--text-tertiary)]">{t('apps.eyebrow')}</span>
          <h1 className="home-heading-font mt-2 text-[3.75rem] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)]">
            {t('apps.heroTitleA')}<br />{t('apps.heroTitleB')}
          </h1>
          <p className="mt-4 max-w-[460px] text-[1.125rem] leading-relaxed text-[var(--text-secondary)]">
            {t('apps.heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/developer/apps/new"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t('apps.newApplication')}
            </Link>
            <a
              href="/developer/api"
              className="inline-flex h-11 items-center rounded-xl border border-[var(--border-default)] px-5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)]"
            >
              {t('apps.browseApiDocs')}
            </a>
          </div>
        </div>
        <div className="shrink-0 sm:w-[300px] lg:w-[380px]">
          <img
            src="/images/developer-apps-hero.png"
            alt=""
            aria-hidden
            className="w-full object-contain opacity-90"
          />
        </div>
      </section>

      <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">{t('apps.myApplications')}</h2>
        <button
          onClick={() => router.push('/developer/apps/new')}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[var(--text-primary)] text-sm font-medium text-[var(--bg-0)] hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          {t('apps.newApplication')}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--text-secondary)]">{t('apps.loading')}</p>
      ) : !apps?.length ? (
        <div className="rounded-xl border border-[var(--border-subtle)] p-8 text-center flex flex-col gap-3">
          <p className="text-sm text-[var(--text-secondary)]">{t('apps.noAppsYet')}</p>
          <button
            onClick={() => router.push('/developer/apps/new')}
            className="mx-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[var(--text-primary)] text-sm font-medium text-[var(--bg-0)]"
          >
            <Plus size={14} /> {t('apps.createFirstApp')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map(app => (
            <AppCard key={app.id} app={app} onDelete={handleDelete} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
