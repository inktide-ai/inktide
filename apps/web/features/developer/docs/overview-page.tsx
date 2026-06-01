import Link from 'next/link'
import { ArrowRight, Cpu, Globe, Layers, LayoutTemplate, Server, Shield, Terminal, Webhook } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Quick Start', desc: 'Run the full stack locally in 5 steps',               cta: 'Read guide',  href: '/developer/quickstart' },
  { label: 'REST API',    desc: '18 endpoints with method badges and request schemas',  cta: 'Browse API',  href: '/developer/api' },
  { label: 'OAuth 2.0',  desc: 'Integrate PKCE authorization into your app',           cta: 'View flow',   href: '/developer/oauth' },
  { label: 'Webhooks',   desc: 'React to real-time platform events with signatures',   cta: 'See events',  href: '/developer/webhooks' },
]

const SECTIONS = [
  { icon: Cpu,            label: 'Architecture',    href: '/developer/architecture', desc: 'Pipeline, bounded contexts, dependency rules' },
  { icon: Terminal,       label: 'Quick Start',     href: '/developer/quickstart',   desc: 'Run the full stack locally in 5 steps' },
  { icon: LayoutTemplate, label: 'Frontend Routes', href: '/developer/routes',       desc: 'All workspace and public Next.js routes' },
  { icon: Globe,          label: 'REST API',        href: '/developer/api',          desc: '18 endpoints with method badges and schemas' },
  { icon: Layers,         label: 'Frontend Arch',   href: '/developer/frontend',     desc: 'FSD, TanStack Query, Keycloak auth flow' },
  { icon: Shield,         label: 'OAuth 2.0',       href: '/developer/oauth',        desc: 'PKCE auth flow, scopes, token exchange' },
  { icon: Webhook,        label: 'Webhooks',        href: '/developer/webhooks',     desc: 'Event types, signed payloads, verification' },
  { icon: Server,         label: 'Services',        href: '/developer/services',     desc: 'All local development service ports' },
]

export function OverviewPage() {
  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-[1300px] px-6 py-8">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center gap-10">
        <div className="flex-1">
          <span className="text-xs font-medium text-[var(--text-tertiary)]">Docs</span>
          <h1 className="home-heading-font mt-2 text-[3.75rem] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)]">
            Build on<br />Inktide
          </h1>
          <p className="mt-4 max-w-[460px] text-[1.125rem] leading-relaxed text-[var(--text-secondary)]">
            Inktide is an AI-powered streaming platform. Connect your Soul to Discord, Twitch, and
            Telegram — voice responses in under 1.3 seconds.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/developer/quickstart"
              className="flex h-11 items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Quick Start
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/developer/api"
              className="flex h-11 items-center rounded-xl border border-[var(--border-default)] px-5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)]"
            >
              View API
            </Link>
          </div>
        </div>

        <div className="hidden shrink-0 sm:block" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/developer-hero.png"
            alt=""
            className="h-[260px] w-auto object-contain"
          />
        </div>
      </div>

      {/* ── Quick links (KombiBlock) ─────────────────────────────────── */}
      <div className="mb-20 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_LINKS.map(({ label, desc, cta, href }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 transition-all hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]"
          >
            <p className="text-sm font-bold text-[var(--text-primary)]">{label}</p>
            <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--text-secondary)]">{desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)]">
              {cta} <ArrowRight size={11} />
            </span>
          </Link>
        ))}
      </div>

      {/* ── Feature grid ─────────────────────────────────────────────── */}
      <div>
        <h2 className="home-heading-font text-center text-[2rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
          Everything you need to build
        </h2>
        <p className="mx-auto mt-3 max-w-[480px] text-center text-[1rem] leading-relaxed text-[var(--text-secondary)]">
          Deep-dive into the architecture, APIs, auth flows, and integrations that power Inktide.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ icon: Icon, label, href, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 transition-all hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]"
            >
              <Icon size={24} className="text-[var(--accent-primary)]" />
              <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">{label}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
    </div>
  )
}
