import Link from 'next/link'
import { ArrowRight, Cpu, Globe, Layers, LayoutTemplate, Server, Shield, Terminal, Webhook } from 'lucide-react'
import { getTranslations } from '@/lib/i18n-server'

const QUICK_LINKS = [
  { labelKey: 'nav.quickStart', descKey: 'docs.overview.ql.quickStartDesc', ctaKey: 'docs.overview.ql.readGuide',  href: '/developer/quickstart' },
  { labelKey: 'nav.restApi',    descKey: 'docs.overview.ql.restApiDesc',    ctaKey: 'docs.overview.ql.browseApi',  href: '/developer/api' },
  { labelKey: 'nav.oauth',      descKey: 'docs.overview.ql.oauthDesc',      ctaKey: 'docs.overview.ql.viewFlow',   href: '/developer/oauth' },
  { labelKey: 'nav.webhooks',   descKey: 'docs.overview.ql.webhooksDesc',   ctaKey: 'docs.overview.ql.seeEvents',  href: '/developer/webhooks' },
]

const SECTIONS = [
  { icon: Cpu,            labelKey: 'nav.architecture',   href: '/developer/architecture', descKey: 'docs.overview.sec.architectureDesc' },
  { icon: Terminal,       labelKey: 'nav.quickStart',     href: '/developer/quickstart',   descKey: 'docs.overview.sec.quickStartDesc' },
  { icon: LayoutTemplate, labelKey: 'nav.frontendRoutes', href: '/developer/routes',       descKey: 'docs.overview.sec.frontendRoutesDesc' },
  { icon: Globe,          labelKey: 'nav.restApi',        href: '/developer/api',          descKey: 'docs.overview.sec.restApiDesc' },
  { icon: Layers,         labelKey: 'nav.frontendArch',   href: '/developer/frontend',     descKey: 'docs.overview.sec.frontendArchDesc' },
  { icon: Shield,         labelKey: 'nav.oauth',          href: '/developer/oauth',        descKey: 'docs.overview.sec.oauthDesc' },
  { icon: Webhook,        labelKey: 'nav.webhooks',       href: '/developer/webhooks',     descKey: 'docs.overview.sec.webhooksDesc' },
  { icon: Server,         labelKey: 'nav.services',       href: '/developer/services',     descKey: 'docs.overview.sec.servicesDesc' },
]

export async function OverviewPage() {
  const t = await getTranslations('developer')
  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-[1300px] px-6 py-8">

      <div className="mb-8 flex items-center gap-10">
        <div className="flex-1">
          <span className="text-xs font-medium text-[var(--text-tertiary)]">{t('docs.overview.eyebrow')}</span>
          <h1 className="home-heading-font mt-2 text-[2.75rem] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--text-primary)] sm:text-[3.75rem]">
            {t('docs.overview.titleA')}<br />{t('docs.overview.titleB')}
          </h1>
          <p className="mt-4 max-w-[460px] text-[1.125rem] leading-relaxed text-[var(--text-secondary)]">
            {t('docs.overview.subtitle')}
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/developer/quickstart"
              className="flex h-11 items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t('docs.overview.quickStartBtn')}
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/developer/api"
              className="flex h-11 items-center rounded-xl border border-[var(--border-default)] px-5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)]"
            >
              {t('docs.overview.viewApiBtn')}
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

      <div className="mb-20 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_LINKS.map(({ labelKey, descKey, ctaKey, href }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 transition-all hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]"
          >
            <p className="text-sm font-bold text-[var(--text-primary)]">{t(labelKey)}</p>
            <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--text-secondary)]">{t(descKey)}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)]">
              {t(ctaKey)} <ArrowRight size={11} />
            </span>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="home-heading-font text-center text-[2rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
          {t('docs.overview.everythingTitle')}
        </h2>
        <p className="mx-auto mt-3 max-w-[480px] text-center text-[1rem] leading-relaxed text-[var(--text-secondary)]">
          {t('docs.overview.everythingSubtitle')}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ icon: Icon, labelKey, href, descKey }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 transition-all hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]"
            >
              <Icon size={24} className="text-[var(--accent-primary)]" />
              <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">{t(labelKey)}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">{t(descKey)}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
    </div>
  )
}
