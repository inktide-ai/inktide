'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getPublicCard } from '@/features/soul'
import { ActivityFeed } from '@/features/soul/activity'
import { Skeleton } from '@/shared/ui/skeleton'
import { HOME_ROUTE } from '@/lib/routes'


const PLATFORM_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  discord:  { bg: 'rgba(88,101,242,0.15)',  fg: '#5865f2', label: 'Discord'  },
  twitch:   { bg: 'rgba(145,70,255,0.15)',  fg: 'var(--platform-twitch)', label: 'Twitch'   },
  kick:     { bg: 'rgba(83,252,24,0.12)',   fg: '#2ecc00', label: 'Kick'     },
  vk_video: { bg: 'rgba(0,119,255,0.15)',   fg: '#0077ff', label: 'VK Video' },
  youtube:  { bg: 'rgba(255,0,0,0.12)',     fg: '#ff0000', label: 'YouTube'  },
  telegram: { bg: 'rgba(0,136,204,0.12)',   fg: '#0088cc', label: 'Telegram' },
}

function PlatformBadge({ platform }: { platform: string }) {
  const cfg = PLATFORM_COLORS[platform.toLowerCase()]
  if (!cfg) return null
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  )
}


function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-0)]">
      <div className="h-14 border-b border-[var(--border-subtle)]" />
      <Skeleton className="h-[220px] w-full" />
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-8">
        <Skeleton className="mb-4 -mt-14 h-[100px] w-[100px] rounded-2xl" />
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-6 h-4 w-32" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  )
}


export function PageClient() {
  const params = useParams()
  const slug = params.id as string

  const { data: soul, isLoading, isError } = useQuery({
    queryKey: ['public-card', slug],
    queryFn: () => getPublicCard(slug),
    staleTime: 60_000,
    retry: 1,
  })

  if (isLoading) return <ProfileSkeleton />

  if (isError || !soul) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center bg-[var(--bg-0)]">
        <p className="text-[1rem] font-semibold text-[var(--text-primary)]">Soul not found</p>
        <Link href="/" className="text-body text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          ← Back to Inktide
        </Link>
      </div>
    )
  }

  const personalityExcerpt = soul.personality.length > 220
    ? soul.personality.slice(0, 220).trimEnd() + '…'
    : soul.personality

  return (
    <div className="min-h-screen bg-[var(--bg-0)]">
      {/* Top bar */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] px-6">
        <Link href="/" className="text-[15px] font-semibold text-[var(--text-primary)]">Inktide</Link>
        <Link
          href={HOME_ROUTE}
          className="rounded-xl bg-[var(--accent-primary)] px-4 py-1.5 text-body font-semibold text-white hover:opacity-90"
        >
          Open app
        </Link>
      </div>

      {/* Cover banner */}
      {soul.cover_url ? (
        <div
          className="h-[220px] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${soul.cover_url})` }}
        />
      ) : (
        <div
          className="h-[160px] w-full"
          style={{
            background: `linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)`,
            opacity: 0.25,
          }}
        />
      )}

      {/* Profile card */}
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 pb-16 text-center">

        {/* Avatar — overlaps cover */}
        <div className="-mt-12 mb-4 overflow-hidden rounded-2xl border-2 border-[var(--bg-0)] shadow-xl">
          <img
            src={soul.avatar_url ?? '/avatars/nova.png'}
            alt={soul.name}
            className="h-[96px] w-[96px] object-cover"
          />
        </div>

        {/* Name */}
        <h1 className="text-[1.75rem] font-bold tracking-[-0.025em] text-[var(--text-primary)]">
          {soul.name}
        </h1>
        <p className="mt-0.5 text-body text-[var(--text-tertiary)]">@{soul.slug}</p>

        {soul.description && (
          <p className="mt-2 text-body-md text-[var(--text-secondary)]">{soul.description}</p>
        )}

        {/* Status */}
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${soul.is_active ? 'bg-emerald-400' : 'bg-[var(--text-tertiary)]'}`} />
          <span className="text-sm text-[var(--text-secondary)]">
            {soul.is_active ? 'Active' : 'Offline'}
          </span>
        </div>

        {/* Platforms */}
        {soul.platforms.length > 0 && (
          <div className="mt-5 w-full">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Connected to</p>
            <div className="flex flex-wrap justify-center gap-2">
              {soul.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
            </div>
          </div>
        )}

        {/* Personality excerpt */}
        {soul.personality && (
          <div className="mt-5 w-full rounded-2xl border border-[var(--border-card)] bg-[var(--surface-card)] p-4 text-left">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Personality</p>
            <p className="text-body leading-relaxed text-[var(--text-secondary)]">{personalityExcerpt}</p>
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-5 w-full">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Recent Activity
          </p>
          <ActivityFeed slug={slug} />
        </div>

        {/* Powered by Inktide */}
        <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-6 py-4">
          <span className="text-sm text-[var(--text-tertiary)]">Powered by</span>
          <span className="text-body-md font-semibold text-[var(--text-primary)]">Inktide</span>
          <span className="text-[var(--text-tertiary)]">·</span>
          <Link
            href="/pricing"
            className="text-body font-semibold text-[var(--accent-primary)] hover:opacity-80"
          >
            Create your own →
          </Link>
        </div>

      </div>
    </div>
  )
}
