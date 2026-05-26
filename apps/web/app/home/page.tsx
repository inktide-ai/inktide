'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Folder, Mic, Radio, Siren } from 'lucide-react'
import type { SoulCardData } from '@/features/soul/components/soul-card'
import { SoulCardVertical } from '@/features/soul/components/soul-card-vertical'
import { SoulCardVerticalSkeleton } from '@/features/soul/components/soul-card-vertical-skeleton'
import { TwitchIcon } from '@/components/icons/twitch-icon'
import { useFavorites } from '@/features/soul/hooks/useFavorites'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { fetchDashboardStats } from '@/api/stats'
import { queryKeys } from '@/shared/lib/query/keys'
import { SectionHeader } from '@/features/workspace-home/section-header'
import { SoulCreationWizard } from '@/features/workspace-home/soul-creation-wizard'
import { ProjectCardConnected } from '@/features/workspace-home/project-card-connected'
import { ProjectCreationWizard } from '@/features/workspace-home/project-creation-wizard'
import { listProjects } from '@/features/projects/api/projects'
import { createDiscordCustomBotChannel } from '@/features/soul/api/index'
import { StatCard } from '@/features/workspace-home/stat-card'
import { TemplateCard } from '@/features/workspace-home/template-card'
import { WorkspaceTopBar } from '@/features/workspace-home/workspace-topbar'
import { toSoulCardData } from '@/features/soul/lib/card-display'
import { buildSpark } from '@/lib/spark'
import { formatApiCalls, editedLabel } from '@/lib/format-utils'
import { HOME_TEMPLATES } from '@/shared/data/home-templates'

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  twitch: <TwitchIcon size={16} />,
  bot:    <Bot size={16} />,
  radio:  <Radio size={16} />,
  mic:    <Mic size={16} />,
  siren:  <Siren size={16} />,
}

export default function HomePage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { favs, toggle } = useFavorites()
  const { cardList, loading, addCharacter } = useCharactersContext()
  const [showWizard, setShowWizard] = useState(false)
  const [showProjectWizard, setShowProjectWizard] = useState(false)
  const [showUpgraded, setShowUpgraded] = useState(searchParams.get('upgraded') === '1')

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

  const visible = useMemo<SoulCardData[]>(
    () => cardList
      .map(toSoulCardData)
      .sort((a, b) => {
        const af = favs.has(a.id) ? 0 : 1
        const bf = favs.has(b.id) ? 0 : 1
        return af - bf || a.name.localeCompare(b.name)
      }),
    [cardList, favs],
  )

  const activeChannels = useMemo(
    () => cardList.reduce((n, c) => n + (c.is_active ? 1 : 0), 0),
    [cardList],
  )

  return (
    <div className="home-font-split relative h-full min-h-screen overflow-hidden bg-[var(--bg-0)]">
      {showUpgraded && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-[13px] font-medium shadow-lg whitespace-nowrap"
          style={{ background: '#166534', color: '#dcfce7', border: '1px solid #15803d' }}
        >
          <span>{t('billing.subscriptionActivated')}</span>
          <button type="button" onClick={() => setShowUpgraded(false)} style={{ opacity: 0.7, lineHeight: 1 }}>✕</button>
        </div>
      )}
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
                  {HOME_TEMPLATES.map(template => (
                    <TemplateCard
                      key={template.id}
                      title={template.title}
                      subtitle={template.subtitle}
                      icon={TEMPLATE_ICONS[template.icon]}
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
