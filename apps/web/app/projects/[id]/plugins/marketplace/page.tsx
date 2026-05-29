'use client'

import { useParams, useRouter } from 'next/navigation'
import { Puzzle } from 'lucide-react'

export default function PluginMarketplacePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-[1248px] px-6 flex-none">
      <div className="my-6 flex flex-1 flex-col min-w-0">
        <section className="flex flex-col gap-6">

          <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center md:gap-2">
            <div className="flex flex-col gap-2">
              <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[var(--text-heading)]">
                Plugin Marketplace
              </h2>
              <span className="text-body text-balance text-[var(--text-secondary)]">
                Discover and install community-built context providers and integrations.
              </span>
            </div>
            <div className="flex flex-col items-stretch gap-2 md:flex-row">
              <button
                type="button"
                onClick={() => router.push(`/projects/${id}/plugins`)}
                className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-[var(--border-subtle)] bg-transparent px-4 text-body font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-subtle)]"
              >
                ← Back to Plugins
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--border-subtle)] py-24">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Puzzle size={24} className="text-[var(--text-secondary)]" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-[1rem] font-semibold text-[var(--text-heading)]">
                Plugin Marketplace — coming soon
              </p>
              <p className="text-center text-body text-[var(--text-secondary)] max-w-[360px]">
                Community plugins, Webhook Shards, and native integrations will be available here.
              </p>
            </div>
          </div>

        </section>
      </div>
    </div>
  )
}
