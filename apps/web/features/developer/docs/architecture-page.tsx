import type { LucideIcon } from 'lucide-react'
import { ArrowRightLeft, AudioWaveform, Check, Cpu, Database, MessageCircle, MessageSquare, Mic, Monitor, MonitorSpeaker, Plus, Send, Tv, Wifi, X, Zap } from 'lucide-react'
import { CodeBlock, DocPage, PageSubtitle, PageTitle, SectionDivider, SectionHeading, Table, TableHead, TableRow, Td } from './shared'
import { getTranslations } from '@/lib/i18n-server'

type T = (key: string, vars?: Record<string, string | number>) => string

interface Chip {
  icon?: LucideIcon
  label: string
  bg: string
  text: string
  border: string
}

interface PipelineStage {
  n: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  border: string
  label: string
  detail: string
  chips: Chip[]
  stageChips?: string[]
}

const LAYER_PILLS = [
  { label: 'Domain',         color: 'border-violet-500/30 bg-violet-500/10 text-violet-400' },
  { label: 'Application',    color: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
  { label: 'Infrastructure', color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' },
  { label: 'REST',           color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
]

function buildStages(t: T): PipelineStage[] {
  return [
    {
      n: '01', icon: MessageSquare, iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', border: 'border-blue-500/25',
      label: t('docs.architecture.stage.chatSources'),
      detail: t('docs.architecture.stage.chatSourcesDetail'),
      chips: [
        { icon: MessageCircle, label: 'Discord',  bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
        { icon: Tv,            label: 'Twitch',   bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
        { icon: Send,          label: 'Telegram', bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
        { icon: Plus,          label: t('docs.architecture.chip.more'), bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-tertiary)]', border: 'border-[var(--border-subtle)]' },
      ],
    },
    {
      n: '02', icon: ArrowRightLeft, iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', border: 'border-violet-500/25',
      label: t('docs.architecture.stage.connector'),
      detail: t('docs.architecture.stage.connectorDetail'),
      chips: [
        { icon: Database, label: 'Redis Stream', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
      ],
    },
    {
      n: '03', icon: Cpu, iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-400', border: 'border-indigo-500/25',
      label: t('docs.architecture.stage.synapse'),
      detail: t('docs.architecture.stage.synapseDetail'),
      chips: [],
      stageChips: [t('docs.architecture.sc.analysis'), t('docs.architecture.sc.context'), t('docs.architecture.sc.activity'), 'RAG', t('docs.architecture.sc.emotion'), t('docs.architecture.sc.decision'), t('docs.architecture.sc.llmPrep')],
    },
    {
      n: '04', icon: Zap, iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400', border: 'border-orange-500/25',
      label: 'vLLM',
      detail: t('docs.architecture.stage.vllmDetail'),
      chips: [
        { icon: Zap, label: t('docs.architecture.chip.gpuBottleneck'), bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
      ],
    },
    {
      n: '05', icon: Mic, iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', border: 'border-emerald-500/25',
      label: t('docs.architecture.stage.tts'),
      detail: t('docs.architecture.stage.ttsDetail'),
      chips: [
        { icon: AudioWaveform, label: t('docs.architecture.chip.firstSentence'), bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
      ],
    },
    {
      n: '06', icon: MonitorSpeaker, iconBg: 'bg-teal-500/15', iconColor: 'text-teal-400', border: 'border-teal-500/25',
      label: t('docs.architecture.stage.playback'),
      detail: t('docs.architecture.stage.playbackDetail'),
      chips: [
        { icon: Wifi,    label: 'SignalR AudioHub', bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
        { icon: Monitor, label: t('docs.architecture.chip.obsBrowser'), bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
      ],
    },
  ]
}

export async function ArchitecturePage() {
  const t = await getTranslations('developer')
  const PIPELINE_STAGES = buildStages(t)
  const ALLOWED = [t('docs.architecture.allowed1'), t('docs.architecture.allowed2'), t('docs.architecture.allowed3')]
  const FORBIDDEN = [t('docs.architecture.forbidden1'), t('docs.architecture.forbidden2'), t('docs.architecture.forbidden3'), t('docs.architecture.forbidden4')]
  const CONTEXTS: [string, string][] = [
    ['Soul',         t('docs.architecture.ctx.soul')],
    ['Synapse',      t('docs.architecture.ctx.synapse')],
    ['Memory',       t('docs.architecture.ctx.memory')],
    ['Connector',    t('docs.architecture.ctx.connector')],
    ['TTS',          t('docs.architecture.ctx.tts')],
    ['Profile',      t('docs.architecture.ctx.profile')],
    ['Project',      t('docs.architecture.ctx.project')],
    ['Organization', t('docs.architecture.ctx.organization')],
    ['Billing',      t('docs.architecture.ctx.billing')],
    ['Graph',        t('docs.architecture.ctx.graph')],
  ]
  const LATENCY: [string, string][] = [
    ['0–200ms',    t('docs.architecture.lat.t1')],
    ['200–3000ms', t('docs.architecture.lat.t2')],
    ['500–1300ms', t('docs.architecture.lat.t3')],
  ]
  return (
    <DocPage>
      <PageTitle eyebrow={t('docs.architecture.eyebrow')}>{t('docs.architecture.title')}</PageTitle>
      <PageSubtitle>
        {t('docs.architecture.subtitle')}
      </PageSubtitle>

      <SectionHeading>{t('docs.architecture.messagePipeline')}</SectionHeading>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">{t('docs.architecture.pipelineSubtitle')}</p>

      <div className="overflow-x-auto">
        <div className="flex min-w-max items-stretch">
          {PIPELINE_STAGES.map((stage, i) => {
            const Icon = stage.icon
            const isLast = i === PIPELINE_STAGES.length - 1
            return (
              <div key={stage.label} className="flex items-center">
                {/* Card */}
                <div className={`relative flex w-[210px] flex-col rounded-2xl border bg-[var(--surface-1)] p-4 ${stage.border}`}>
                  {/* Step number */}
                  <span className="absolute right-4 top-4 font-mono text-sm font-medium text-[var(--text-tertiary)]">
                    {stage.n}
                  </span>

                  {/* Icon */}
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${stage.iconBg}`}>
                    <Icon size={22} className={stage.iconColor} />
                  </div>

                  {/* Title + description */}
                  <p className="text-sm font-bold text-[var(--text-primary)]">{stage.label}</p>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--text-secondary)]">{stage.detail}</p>

                  {/* Bottom chips */}
                  <div className="mt-4">
                    {stage.stageChips ? (
                      <div className="grid grid-cols-2 gap-1">
                        {stage.stageChips.map(s => (
                          <span key={s} className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-center text-[10px] font-medium text-indigo-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {stage.chips.map(chip => {
                          const ChipIcon = chip.icon
                          return (
                            <span key={chip.label} className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium ${chip.bg} ${chip.text} ${chip.border}`}>
                              {ChipIcon && <ChipIcon size={10} />}
                              {chip.label}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow connector */}
                {!isLast && (
                  <div className="flex w-8 shrink-0 items-center justify-center text-sm text-[var(--text-tertiary)]">
                    →
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Latency cards */}
      <div className="mb-8 mt-8 grid grid-cols-3 gap-3 text-center">
        {LATENCY.map(([time, desc]) => (
          <div key={time} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 [border-top-color:var(--accent-primary)] [border-top-width:2px]">
            <p className="font-mono text-sm font-bold text-[var(--accent-primary)]">{time}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{desc}</p>
          </div>
        ))}
      </div>

      <SectionDivider />

      <SectionHeading>{t('docs.architecture.boundedContexts')}</SectionHeading>
      <Table>
        <TableHead cols={[t('docs.architecture.colContext'), t('docs.architecture.colResponsibility')]} />
        <tbody>
          {CONTEXTS.map(([ctx, desc]) => (
            <TableRow key={ctx}>
              <Td mono accent>{ctx}</Td>
              <Td>{desc}</Td>
            </TableRow>
          ))}
        </tbody>
      </Table>

      <SectionDivider />

      <SectionHeading>{t('docs.architecture.dependencyDirection')}</SectionHeading>
      <p className="mb-6 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
        {t('docs.architecture.dependencyText')}
      </p>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
        {LAYER_PILLS.map((pill, i) => (
          <div key={pill.label} className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 font-mono text-xs font-semibold ${pill.color}`}>
              {pill.label}
            </span>
            {i < LAYER_PILLS.length - 1 && (
              <span className="text-sm text-[var(--text-tertiary)]">→</span>
            )}
          </div>
        ))}
        <p className="mt-3 w-full text-center text-[11px] text-[var(--text-tertiary)]">
          {t('docs.architecture.dependencyCaption')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Check size={12} /> {t('docs.architecture.allowed')}
          </p>
          <ul className="space-y-2">
            {ALLOWED.map(r => (
              <li key={r} className="flex items-start gap-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                <Check size={11} className="mt-0.5 shrink-0 text-emerald-400" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
            <X size={12} /> {t('docs.architecture.forbidden')}
          </p>
          <ul className="space-y-2">
            {FORBIDDEN.map(r => (
              <li key={r} className="flex items-start gap-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                <X size={11} className="mt-0.5 shrink-0 text-red-400" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <SectionDivider />

      <SectionHeading>{t('docs.architecture.repositoryLayout')}</SectionHeading>
      <CodeBlock>
{`src/             .NET 10 solution — API host + bounded context modules
apps/web/        Next.js 16 / React 18 frontend
apps/desktop/    Tauri desktop app
crates/          Rust workspace — media, audio, animation, lipsync
fast-api/        Python FastAPI — embeddings worker (8000) + Scribe (8001)
keycloak/        Custom Keycloakify theme + Twitch identity provider (Java)
docs/            Architecture documentation`}
      </CodeBlock>
    </DocPage>
  )
}
