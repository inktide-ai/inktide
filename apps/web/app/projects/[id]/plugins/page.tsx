'use client'

import { useParams, useRouter } from 'next/navigation'
import { Brain, Link, Puzzle, User, Webhook } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PluginCard } from '@/features/plugins/plugin-card'
import { getProjectPlugins, upsertProjectPlugin, type ProjectPlugin } from '@/api/plugins'
import { queryKeys } from '@/shared/lib/query/keys'
import { useState } from 'react'

const btnSecondary =
  'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-[var(--border-subtle)] bg-transparent px-4 text-[0.875rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-subtle)]'

const BUILTIN_PLUGINS: { id: string; name: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'rag',
    name: 'Memory RAG',
    description: 'Injects relevant memories from the vector store into the prompt.',
    icon: <Brain size={18} className="text-[var(--text-secondary)]" />,
  },
  {
    id: 'soul',
    name: 'Soul Context',
    description: "Injects the character's personality and directives into the prompt.",
    icon: <User size={18} className="text-[var(--text-secondary)]" />,
  },
  {
    id: 'webhook',
    name: 'Webhook Shard',
    description: 'Calls your external service for custom context (max 800 ms timeout).',
    icon: <Webhook size={18} className="text-[var(--text-secondary)]" />,
  },
]

function getPlugin(plugins: ProjectPlugin[], id: string): ProjectPlugin {
  return plugins.find(p => p.plugin_id === id) ?? { plugin_id: id, is_enabled: true, config: {} }
}

export default function ProjectPluginsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: plugins = [], isLoading } = useQuery({
    queryKey: queryKeys.projects.plugins(id),
    queryFn: () => getProjectPlugins(id),
  })

  const [savingId, setSavingId] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')

  const mutation = useMutation({
    mutationFn: ({ pluginId, isEnabled, config }: { pluginId: string; isEnabled: boolean; config?: Record<string, string> }) =>
      upsertProjectPlugin(id, pluginId, { is_enabled: isEnabled, config }),
    onMutate: ({ pluginId }) => setSavingId(pluginId),
    onSettled: () => setSavingId(null),
    onSuccess: updated => {
      queryClient.setQueryData<ProjectPlugin[]>(queryKeys.projects.plugins(id), prev =>
        prev
          ? prev.some(p => p.plugin_id === updated.plugin_id)
            ? prev.map(p => (p.plugin_id === updated.plugin_id ? updated : p))
            : [...prev, updated]
          : [updated],
      )
      if (updated.plugin_id === 'webhook') {
        setWebhookUrl(updated.config.url ?? '')
      }
    },
  })

  function handleToggle(pluginId: string, enabled: boolean) {
    const current = getPlugin(plugins, pluginId)
    mutation.mutate({ pluginId, isEnabled: enabled, config: current.config })
  }

  function handleWebhookUrlSave() {
    const current = getPlugin(plugins, 'webhook')
    mutation.mutate({ pluginId: 'webhook', isEnabled: current.is_enabled, config: { ...current.config, url: webhookUrl } })
  }

  return (
    <div className="mx-auto w-full max-w-[1248px] px-6" style={{ flex: '0 0 auto' }}>
      <div className="my-6 flex flex-1 flex-col min-w-0">
        <section className="flex flex-col gap-6">

          {/* header row */}
          <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center md:gap-2">
            <div className="flex flex-col gap-2">
              <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[var(--text-heading)]">
                Plugins
              </h2>
              <span className="text-[0.875rem] text-balance text-[var(--text-secondary)]">
                Control which context providers run during message processing for this project.
              </span>
            </div>
            <div className="flex flex-col items-stretch gap-2 md:flex-row">
              <button
                type="button"
                onClick={() => router.push(`/projects/${id}/plugins/marketplace`)}
                className={btnSecondary}
              >
                Browse Marketplace
              </button>
            </div>
          </div>

          {/* content row */}
          <div className="flex flex-col lg:flex-row gap-8">

            {/* left: plugin cards */}
            <div className="flex flex-1 flex-col gap-3">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--surface-1)]" />
                ))
              ) : (
                BUILTIN_PLUGINS.map(def => {
                  const plugin = getPlugin(plugins, def.id)
                  const isWebhook = def.id === 'webhook'

                  return (
                    <PluginCard
                      key={def.id}
                      pluginId={def.id}
                      name={def.name}
                      description={def.description}
                      icon={def.icon}
                      isEnabled={plugin.is_enabled}
                      saving={savingId === def.id}
                      onToggle={enabled => handleToggle(def.id, enabled)}
                      configSlot={isWebhook ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)]">
                            Webhook URL
                          </label>
                          <div className="flex gap-2">
                            <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3">
                              <Link size={13} className="shrink-0 text-[var(--text-tertiary)]" />
                              <input
                                type="url"
                                placeholder="https://your-server.com/inktide/context"
                                value={webhookUrl || (plugin.config.url ?? '')}
                                onChange={e => setWebhookUrl(e.target.value)}
                                className="w-full bg-transparent py-2 text-[0.8125rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleWebhookUrlSave}
                              disabled={savingId === 'webhook'}
                              className="h-9 rounded-lg bg-[var(--accent-primary)] px-3 text-[0.8125rem] font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                          <p className="text-[0.75rem] text-[var(--text-tertiary)]">
                            POST receives <code className="rounded bg-[var(--surface-2)] px-1 py-0.5">message</code>,{' '}
                            <code className="rounded bg-[var(--surface-2)] px-1 py-0.5">soul_id</code>,{' '}
                            <code className="rounded bg-[var(--surface-2)] px-1 py-0.5">channel_id</code>.
                            Return <code className="rounded bg-[var(--surface-2)] px-1 py-0.5">{"{ context: string }"}</code> within 800 ms.
                          </p>
                        </div>
                      ) : undefined}
                    />
                  )
                })
              )}
            </div>

            {/* right: sidebar */}
            <div className="flex w-[305px] shrink-0 flex-col items-center gap-6 rounded-xl border border-[var(--border-subtle)] p-6">
              <Puzzle size={24} />

              <div className="flex flex-col items-center gap-1">
                <p className="text-center text-[1rem] font-semibold text-[var(--text-heading)]">
                  Built-in Plugins
                </p>
                <p className="text-center text-[0.875rem] text-[var(--text-secondary)]">
                  Extend your AI pipeline with context providers and custom webhooks.
                </p>
              </div>

              <div className="flex w-full flex-col gap-4">
                {BUILTIN_PLUGINS.map(def => (
                  <div key={def.id} className="flex flex-row items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]">
                      {def.icon}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[1rem] font-semibold leading-snug text-[var(--text-primary)]">{def.name}</p>
                      <p className="text-[0.875rem] leading-snug text-[var(--text-secondary)]">{def.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="w-full border-t border-[var(--border-subtle)]" />

              <button
                type="button"
                onClick={() => router.push(`/projects/${id}/plugins/marketplace`)}
                className={btnSecondary + ' w-full justify-center'}
              >
                Browse Marketplace
              </button>
            </div>

          </div>
        </section>
      </div>
    </div>
  )
}
