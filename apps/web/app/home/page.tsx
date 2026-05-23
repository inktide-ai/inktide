'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Folder, Mic, Radio, Siren } from 'lucide-react'
import { type SoulCardData, type SoulPlatform } from '@/components/hub/soul-card'
import { SoulCardVertical } from '@/components/hub/soul-card-vertical'
import { SoulCardVerticalSkeleton } from '@/components/soul/soul-card-vertical-skeleton'
import { splitPersonalityForSoulCard } from '@/lib/soul-card-personality'
import { useFavorites } from '@/hooks/useFavorites'
import { useCharactersContext } from '@/context/CharactersContext'
import { fetchDashboardStats } from '@/api/stats'
import { queryKeys } from '@/lib/query/keys'
import { SectionHeader } from '@/components/workspace/section-header'
import { SoulCreationWizard } from '@/components/workspace/soul-creation-wizard'
import { ProjectCardConnected } from '@/components/workspace/project-card-connected'
import { ProjectCreationWizard } from '@/components/workspace/project-creation-wizard'
import { listProjects } from '@/api/projects'
import { createDiscordCustomBotChannel } from '@/api/soul'
import { StatCard } from '@/components/workspace/stat-card'
import { TemplateCard } from '@/components/workspace/template-card'
import { WorkspaceTopBar } from '@/components/workspace/workspace-topbar'
import { statusFromCard, accentFromCard } from '@/lib/home-utils'
import { buildSpark } from '@/lib/spark'

function TwitchIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" fill="currentColor"/>
    </svg>
  )
}

const DEFAULT_SOUL_PLATFORMS: SoulPlatform[] = ['twitch', 'discord', 'telegram']

function formatApiCalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function editedLabel(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `Edited ${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `Edited ${h}h ago`
  return `Edited ${Math.floor(h / 24)}d ago`
}

const DEMO_TEMPLATES = [
  { id: '1', title: 'Twitch Chat Bot',   subtitle: 'Ready to use', icon: <TwitchIcon size={16} /> },
  { id: '2', title: 'Discord Assistant', subtitle: 'Ready to use', icon: <Bot size={16} /> },
  { id: '3', title: 'AI VTuber',         subtitle: 'Ready to use', icon: <Radio size={16} /> },
  { id: '4', title: 'Voice Assistant',   subtitle: 'Ready to use', icon: <Mic size={16} /> },
  { id: '5', title: 'Alert System',      subtitle: 'Ready to use', icon: <Siren size={16} /> },
]

export default function HomePage() {
  const router = useRouter()
  const { favs, toggle } = useFavorites()
  const { cardList, loading, addCharacter } = useCharactersContext()
  const [showWizard, setShowWizard] = useState(false)
  const [showProjectWizard, setShowProjectWizard] = useState(false)

  const { data: stats = null } = useQuery({
    queryKey: queryKeys.stats.dashboard,
    queryFn: fetchDashboardStats,
  })

  const { data: allProjects = [] } = useQuery({
    queryKey: queryKeys.projects.all(),
    queryFn: () => listProjects(),
  })

  const projects = useMemo(
    () => [...allProjects]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5),
    [allProjects],
  )

  const visible = useMemo<SoulCardData[]>(() => {
    return cardList.map(card => {
      const { subtitle, description } = splitPersonalityForSoulCard(card.personality)
      return {
        id: card.id,
        name: card.name,
        subtitle,
        ...(description ? { description } : {}),
        avatarUrl: card.avatar_url || '/avatars/nova.png',
        accentColor: accentFromCard(card.id),
        status: statusFromCard(card.id, card.is_active),
        platforms: DEFAULT_SOUL_PLATFORMS,
      }
    }).sort((a, b) => {
      const af = favs.has(a.id) ? 0 : 1
      const bf = favs.has(b.id) ? 0 : 1
      return af - bf || a.name.localeCompare(b.name)
    })
  }, [cardList, favs])

  const activeChannels = useMemo(
    () => cardList.reduce((n, c) => n + (c.is_active ? 1 : 0), 0),
    [cardList],
  )

  return (
    <div className="home-font-split relative h-full min-h-screen overflow-hidden bg-[var(--bg-0)]">
      <AnimatePresence>
        {showProjectWizard && (
          <ProjectCreationWizard
            onClose={() => setShowProjectWizard(false)}
            onCreated={id => {
              setShowProjectWizard(false)
              router.push(`/projects/${id}`)
            }}
            souls={cardList}
          />
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {showWizard ? (
          <motion.div
            key="wizard"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0"
          >
            <SoulCreationWizard
              onBack={() => setShowWizard(false)}
              onFinish={async (character, discordBotToken) => {
                const id = await addCharacter(character)
                if (id) {
                  if (discordBotToken) {
                    await createDiscordCustomBotChannel(id, discordBotToken).catch(() => {})
                  }
                  setShowWizard(false)
                  router.push(`/souls/${id}`)
                }
                return id
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            initial={{ x: '-4%' }}
            animate={{ x: 0 }}
            exit={{ x: '-4%' }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 overflow-auto px-6 py-6"
          >
            <div className="mx-auto max-w-[1300px]">
              <WorkspaceTopBar onCreateSoul={() => setShowWizard(true)} />

              <section className="mb-7 grid grid-cols-4 gap-3">
                <StatCard
                  label="Total Souls"
                  value={String(cardList.length)}
                  accentColor="var(--stat-accent-primary)"
                  spark={buildSpark(allProjects.map(p => p.updated_at))}
                />
                <StatCard
                  label="Active Channels"
                  value={String(activeChannels)}
                  accentColor="var(--stat-accent-success)"
                  spark={buildSpark(allProjects.filter(p => p.active_soul_id != null).map(p => p.updated_at))}
                />
                <StatCard
                  label="Memory"
                  value={stats ? String(stats.totalMemories) : '—'}
                  accentColor="var(--stat-accent-warn)"
                />
                <StatCard
                  label="API Calls"
                  value={stats ? formatApiCalls(stats.monthlyApiCalls) : '—'}
                  accentColor="var(--stat-accent-info)"
                />
              </section>

              <section className="mb-8">
                <SectionHeader
                  title="Your Souls"
                  tabs={[
                    { id: 'all',     label: 'All',     active: true },
                    { id: 'active',  label: 'Active'              },
                    { id: 'idle',    label: 'Idle'                },
                    { id: 'archive', label: 'Archive'             },
                  ]}
                />
                {loading ? (
                  <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3 xl:grid-cols-4">
                    {[...Array(3)].map((_, i) => <SoulCardVerticalSkeleton key={i} />)}
                  </div>
                ) : visible.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3 xl:grid-cols-4">
                    {visible.map(soul => (
                      <SoulCardVertical
                        key={soul.id}
                        data={soul}
                        isFavorite={favs.has(soul.id)}
                        onFavoriteToggle={() => toggle(soul.id)}
                        onOpen={() => router.push(`/souls/${soul.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 py-6 px-2">
                    <div className="flex h-[160px] w-[300px] shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border-subtle)] text-center">
                      <p className="home-ui-font text-[14px] text-[var(--text-tertiary)]">No souls yet</p>
                      <button
                        type="button"
                        onClick={() => setShowWizard(true)}
                        className="home-ui-font rounded-lg bg-[var(--accent-primary)] px-4 py-1.5 text-[14px] font-semibold text-white hover:bg-[var(--accent-hover)]"
                      >
                        Create your first soul
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="mb-8">
                <SectionHeader title="Recent Projects" />
                <div className="flex gap-3 overflow-x-auto pb-2 py-2">
                  {projects.map(p => (
                    <ProjectCardConnected
                      key={p.id}
                      project={p}
                      editedLabel={editedLabel(p.updated_at)}
                      coverUrlFallback={cardList.find(c => c.id === p.active_soul_id)?.avatar_url ?? undefined}
                      icon={<Folder size={14} />}
                      onClick={() => router.push(`/projects/${p.id}`)}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowProjectWizard(true)}
                    className="flex h-[160px] w-[232px] flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] text-[14px] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  >
                    <span className="text-[18px] leading-none">+</span>
                    New Project
                  </button>
                </div>
              </section>

              <section>
                <SectionHeader title="Start from a template" withArrows={false} />
                <div className="grid grid-cols-6 gap-2">
                  {DEMO_TEMPLATES.map(template => (
                    <TemplateCard
                      key={template.id}
                      title={template.title}
                      subtitle={template.subtitle}
                      icon={template.icon}
                    />
                  ))}
                  <TemplateCard title="Blank Project" subtitle="Start from scratch" icon={<span className="text-[18px]">+</span>} />
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
