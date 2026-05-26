'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, ChevronRight, Copy, ExternalLink, Monitor } from 'lucide-react'
import { getProject } from '@/features/projects/api/projects'
import { getCard, type ChannelResponse } from '@/features/soul/api/index'
import { apiResponseToCharacter } from '@/shared/lib/character/mappers'
import { useCardModel } from '@/features/avatar/hooks/use-card-model'
import { useCardScene } from '@/features/avatar/hooks/use-card-scene'
import type { AiCharacter } from '@/shared/lib/character'
import { buildObsSceneUrl } from '@/lib/utils/obs-url'
import { cn } from '@/lib/utils'

// ── Accordion row ──────────────────────────────────────────────────────────────

function AccordionSection({
  title,
  badge,
  badgeColor = 'default',
  statusIcon,
  children,
  defaultOpen = false,
}: {
  title: string
  badge?: string
  badgeColor?: 'default' | 'green' | 'yellow'
  statusIcon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-[var(--border-subtle)]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--surface-1)]/40"
      >
        <ChevronRight
          size={14}
          className={cn('shrink-0 text-[var(--text-tertiary)] transition-transform duration-150', open && 'rotate-90')}
        />
        <span className="flex-1 text-[14px] font-medium text-[var(--text-primary)]">{title}</span>
        {badge && (
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[12px] font-medium',
            badgeColor === 'green'  && 'bg-green-500/15 text-green-400',
            badgeColor === 'yellow' && 'bg-yellow-500/15 text-yellow-400',
            badgeColor === 'default' && 'bg-[var(--surface-2)] text-[var(--text-secondary)]',
          )}>
            {badge}
          </span>
        )}
        {statusIcon}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// ── Check item ─────────────────────────────────────────────────────────────────

function CheckItem({ ok, label, sub }: { ok: boolean; label: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 px-4 py-3">
      <span className={cn(
        'mt-[3px] h-2 w-2 shrink-0 rounded-full',
        ok ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]' : 'bg-[var(--text-tertiary)]/30',
      )} />
      <div>
        <p className="text-[14px] font-medium text-[var(--text-primary)]">{label}</p>
        <p className={cn('mt-0.5 text-[14px]', ok ? 'text-[var(--text-tertiary)]' : 'text-yellow-400/80')}>{sub}</p>
      </div>
    </div>
  )
}

// ── Metadata label ─────────────────────────────────────────────────────────────

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[14px] text-[var(--text-tertiary)]">{label}</p>
      <div className="text-[14px] font-medium text-[var(--text-primary)]">{children}</div>
    </div>
  )
}

// ── Inner component (needs cardId) ─────────────────────────────────────────────

function ObsContent({ character, cardId }: { character: AiCharacter; cardId: string }) {
  const { model } = useCardModel(cardId)
  const { scene }  = useCardScene(cardId)

  const [channels, setChannels]           = useState<ChannelResponse[] | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [copied, setCopied]               = useState(false)

  useEffect(() => {
    let cancelled = false
    getCard(cardId).then(card => {
      if (cancelled) return
      const active = (card.channels ?? []).filter(c => c.is_active && c.channel_id)
      setChannels(active)
      if (active.length > 0) setSelectedChannelId(active[0].channel_id)
    }).catch(() => { if (!cancelled) setChannels([]) })
    return () => { cancelled = true }
  }, [cardId])

  const hasModel   = !!model && character.appearance.modelType !== 'none'
  const hasChannel = !!channels?.length && !!selectedChannelId
  const isReady    = hasModel && hasChannel

  const obsUrl = useMemo(() => {
    if (!isReady) return null
    return buildObsSceneUrl(window.location.origin, {
      channelId: selectedChannelId!,
      modelUrl:  model!.public_url,
      modelType: character.appearance.modelType,
      sceneUrl:  scene?.public_url,
    })
  }, [isReady, selectedChannelId, model, scene, character.appearance.modelType])

  function copyUrl() {
    if (!obsUrl) return
    navigator.clipboard.writeText(obsUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const requirementsMet = [hasModel, hasChannel].filter(Boolean).length
  const reqBadge = `${requirementsMet}/2`
  const reqColor = requirementsMet === 2 ? 'green' : 'yellow'

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-8">

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">OBS Integration</h1>
          <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">Add your soul as a browser source in OBS Studio.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!obsUrl}
            onClick={copyUrl}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy URL'}
          </button>
          {obsUrl && (
            <a
              href={obsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3 text-[14px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              <ExternalLink size={13} />
              Open Preview
            </a>
          )}
        </div>
      </div>

      {/* Main details card */}
      <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border-subtle)]">
        <div className="flex gap-0">
          {/* Preview */}
          <div className="flex w-[280px] shrink-0 items-center justify-center border-r border-[var(--border-subtle)] bg-[var(--surface-1)]/30 py-10">
            <div className="flex flex-col items-center gap-2 text-[var(--text-tertiary)]">
              <Monitor size={32} strokeWidth={1.25} />
              <span className="text-[14px]">
                {isReady ? 'Browser Source Ready' : 'Not Configured'}
              </span>
            </div>
          </div>

          {/* Metadata grid */}
          <div className="flex-1 p-6">
            <div className="mb-5 grid grid-cols-3 gap-x-8 gap-y-5">
              <Meta label="Status">
                <span className="flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', isReady ? 'bg-green-400' : 'bg-[var(--text-tertiary)]/40')} />
                  {isReady ? 'Ready' : 'Not configured'}
                </span>
              </Meta>
              <Meta label="Soul">{character.name}</Meta>
              <Meta label="Model">
                {hasModel
                  ? `${character.appearance.modelType.toUpperCase()} · ${model?.original_file_name ?? '—'}`
                  : <span className="text-yellow-400/80">No model</span>}
              </Meta>
            </div>

            {/* Channel selector */}
            <div>
              <p className="mb-1.5 text-[14px] text-[var(--text-tertiary)]">Channel</p>
              {channels === null ? (
                <span className="text-[14px] text-[var(--text-tertiary)]">Loading…</span>
              ) : channels.length === 0 ? (
                <span className="text-[14px] text-yellow-400/80">No active channels</span>
              ) : channels.length === 1 ? (
                <span className="text-[14px] font-medium text-[var(--text-primary)]">
                  {channels[0].platform} · {channels[0].channel_name}
                </span>
              ) : (
                <select
                  value={selectedChannelId ?? ''}
                  onChange={e => setSelectedChannelId(e.target.value || null)}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-1.5 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                >
                  {channels.map(ch => (
                    <option key={ch.id} value={ch.channel_id ?? ''}>
                      {ch.platform} · {ch.channel_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* URL section */}
        <div className="border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-[14px] font-medium text-[var(--text-primary)]">Browser Source URL</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!obsUrl}
                onClick={copyUrl}
                className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 text-[14px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40"
              >
                {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {obsUrl && (
                <a
                  href={obsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 text-[14px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
                >
                  <ExternalLink size={11} />
                  Preview
                </a>
              )}
            </div>
          </div>
          <div className="border-t border-[var(--border-subtle)] bg-black/30 px-5 py-3">
            {obsUrl ? (
              <code className="select-all font-mono text-[14px] text-cyan-300/90 break-all">{obsUrl}</code>
            ) : (
              <span className="text-[14px] text-[var(--text-tertiary)]">
                Configure a model and active channel to generate the URL
              </span>
            )}
          </div>
        </div>

        {/* Requirements accordion */}
        <AccordionSection
          title="Requirements"
          badge={reqBadge}
          badgeColor={reqColor}
          defaultOpen={!isReady}
        >
          <div className="flex flex-col gap-2">
            <CheckItem
              ok={hasModel}
              label="Avatar / Model"
              sub={hasModel
                ? `${character.appearance.modelType.toUpperCase()} · ${model?.original_file_name ?? ''}`
                : 'Upload a VRM, GLB, or Live2D model in the Avatars tab'}
            />
            <CheckItem
              ok={hasChannel}
              label="Active Channel"
              sub={hasChannel
                ? `${channels?.length} active channel${(channels?.length ?? 0) !== 1 ? 's' : ''}`
                : 'Add and activate a Discord channel in the Channels tab'}
            />
          </div>
        </AccordionSection>

        {/* Setup guide accordion */}
        <AccordionSection title="Setup Guide" defaultOpen>
          <div className="flex flex-col gap-1">
            {[
              {
                n: 1,
                title: 'Open OBS Studio',
                desc: 'Go to Sources → click "+" → select "Browser".',
              },
              {
                n: 2,
                title: 'Paste the URL',
                desc: 'Set width to 1920 and height to 1080 (or match your canvas). Paste the Browser Source URL above.',
              },
              {
                n: 3,
                title: 'Set custom CSS',
                desc: 'In the Custom CSS field, paste the snippet below to remove the white background:',
                code: 'body { margin: 0; background: transparent; }',
              },
            ].map(({ n, title, desc, code }) => (
              <div key={n} className="flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[var(--surface-1)]/50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[12px] font-semibold text-[var(--text-secondary)]">
                  {n}
                </span>
                <div className="pt-0.5">
                  <p className="text-[14px] font-medium text-[var(--text-primary)]">{title}</p>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-[var(--text-secondary)]">{desc}</p>
                  {code && (
                    <code className="mt-2 inline-block select-all rounded-lg border border-[var(--border-subtle)] bg-black/40 px-3 py-1.5 font-mono text-[12px] text-cyan-300/90">
                      {code}
                    </code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>
      </div>

    </div>
  )
}

// ── Page shell ─────────────────────────────────────────────────────────────────

export default function ProjectObsPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const [character, setCharacter] = useState<AiCharacter | null>(null)
  const [soulId, setSoulId]       = useState<string | null>(null)
  const [noSoul, setNoSoul]       = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getProject(id)
      .then(async p => {
        if (!p.active_soul_id) { setNoSoul(true); return }
        setSoulId(p.active_soul_id)
        const card = await getCard(p.active_soul_id)
        setCharacter(apiResponseToCharacter(card))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)]" />
      </div>
    )
  }

  if (noSoul || !character || !soulId) {
    return (
      <div className="mx-auto max-w-[860px] px-6 py-20 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--text-tertiary)]">
            <Monitor size={22} strokeWidth={1.5} />
          </div>
        </div>
        <p className="mb-1 text-[15px] font-medium text-[var(--text-primary)]">No soul linked</p>
        <p className="mb-5 text-[14px] text-[var(--text-secondary)]">
          Link a soul to this project first to configure the OBS integration.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/projects/${id}/settings`)}
          className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 text-[14px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        >
          Go to Settings → Link Soul
        </button>
      </div>
    )
  }

  return <ObsContent character={character} cardId={soulId} />
}
