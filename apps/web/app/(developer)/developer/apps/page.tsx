'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { AppCard } from '@/features/developer/components/app-card'
import { useMyApps, useDeleteApp } from '@/features/developer/hooks/use-developer-apps'

export default function MyAppsPage() {
  const router = useRouter()
  const { data: apps, isLoading } = useMyApps()
  const deleteApp = useDeleteApp()

  async function handleDelete(id: string) {
    if (!confirm('Delete this application? This action cannot be undone.')) return
    await deleteApp.mutateAsync(id)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--text-heading)]">My Applications</h1>
        <button
          onClick={() => router.push('/developer/apps/new')}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[var(--text-primary)] text-sm font-medium text-[var(--bg-0)] hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          New Application
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : !apps?.length ? (
        <div className="rounded-xl border border-[var(--border-subtle)] p-8 text-center flex flex-col gap-3">
          <p className="text-sm text-[var(--text-secondary)]">No applications yet.</p>
          <button
            onClick={() => router.push('/developer/apps/new')}
            className="mx-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[var(--text-primary)] text-sm font-medium text-[var(--bg-0)]"
          >
            <Plus size={14} /> Create your first app
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
  )
}
