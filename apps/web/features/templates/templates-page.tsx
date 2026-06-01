'use client'

import { useState, useMemo } from 'react'
import { type LucideIcon, Plus, Search, ArrowRight, LayoutGrid, Tv, Bot, Star, Wrench } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { SYSTEM_TEMPLATES, type AnyProjectTemplate, type TemplatePlatform } from '@/shared/data/project-templates'
import { useTemplateStore } from '@/shared/lib/templates/useTemplateStore'
import { FeaturedTemplateCard } from './featured-template-card'
import { TemplateEditorModal } from './template-editor-modal'
import { TemplatePreviewDrawer } from './template-preview-drawer'
import { ProjectTemplateWizard } from '@/features/workspace-home/project-template-wizard'
import { useCharactersContext } from '@/entities/character'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CreateTemplateData } from '@/shared/lib/templates/ITemplateStore'
import { MARKETPLACE_ROUTE } from '@/lib/routes'

const CATEGORIES = ['all', 'streaming', 'assistant', 'vtuber', 'utility'] as const
const PLATFORMS = ['any', 'twitch', 'discord', 'telegram'] as const

const CATEGORY_META: Record<string, { icon: LucideIcon; color: string }> = {
  all:       { icon: LayoutGrid, color: '#6366f1' },
  streaming: { icon: Tv,         color: '#7c3aed' },
  assistant: { icon: Bot,        color: '#2563eb' },
  vtuber:    { icon: Star,       color: '#db2777' },
  utility:   { icon: Wrench,     color: '#d97706' },
}

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  all:       'templates.filterAll',
  streaming: 'templates.categoryStreaming',
  assistant: 'templates.categoryAssistant',
  vtuber:    'templates.categoryVtuber',
  utility:   'templates.categoryUtility',
}

export function TemplatesPage() {
  const { t } = useTranslation('common')
  const store = useTemplateStore()
  const router = useRouter()
  const { cardList: souls } = useCharactersContext()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('any')
  const [previewTemplate, setPreviewTemplate] = useState<AnyProjectTemplate | null>(null)
  const [activeTemplate, setActiveTemplate] = useState<AnyProjectTemplate | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    function matches(tpl: AnyProjectTemplate): boolean {
      const catOk = categoryFilter === 'all' || tpl.category === categoryFilter
      const platOk =
        platformFilter === 'any' ||
        tpl.platforms.includes(platformFilter as TemplatePlatform) ||
        tpl.platforms.includes('any')
      const searchOk = !q || tpl.name.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q)
      return catOk && platOk && searchOk
    }
    return SYSTEM_TEMPLATES.filter(matches)
  }, [search, categoryFilter, platformFilter])

  async function handleCreate(data: CreateTemplateData) {
    await store.create(data)
    setShowCreateModal(false)
  }

  return (
    <div className="min-h-full">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--border-subtle)] px-6 py-14 text-center">
        <h1 className="home-heading-font text-[2.75rem] font-bold tracking-[-0.035em] text-[var(--text-primary)]">
          {t('templates.discover')}
        </h1>
        <p className="mx-auto mt-3 max-w-[480px] text-[1rem] leading-relaxed text-[var(--text-secondary)]">
          {t('templates.discoverSubtitle')}
        </p>
        <div className="mx-auto mt-7 flex max-w-[620px] items-center gap-3">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 transition-colors focus-within:border-[var(--accent-primary)]">
            <Search size={16} className="shrink-0 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('templates.searchPlaceholder')}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            <Plus size={15} />
            {t('templates.newTemplate')}
          </button>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1300px] px-6">

        {/* ── Promo Banner ─────────────────────────────────────────────── */}
        <section className="py-8">
          <div className="relative flex overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]">
            {/* Left: text + CTA */}
            <div className="flex w-[44%] shrink-0 flex-col justify-between px-8 py-8">
              <div>
                <div className="mb-3">
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">AI Templates</span>
                </div>
                <h2 className="home-heading-font text-[1.375rem] font-bold leading-snug tracking-[-0.025em] text-[var(--text-primary)]">
                  {t('templates.bannerTitle')}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">
                  {t('templates.bannerSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('featured-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--text-primary)] transition-opacity hover:opacity-60"
              >
                {t('templates.bannerAction')}
                <ArrowRight size={13} aria-hidden />
              </button>
            </div>

            {/* Right: decorative illustration */}
            <div className="relative flex-1 overflow-hidden" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/templates-banner.png"
                alt=""
                className="absolute bottom-0 right-0 h-[125%] w-auto max-w-none object-contain object-bottom"
              />
            </div>
          </div>
        </section>

        {/* ── Category Grid ─────────────────────────────────────────────── */}
        <section className="pb-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {CATEGORIES.map(cat => {
              const count = cat === 'all'
                ? SYSTEM_TEMPLATES.length
                : SYSTEM_TEMPLATES.filter(tpl => tpl.category === cat).length
              const isActive = categoryFilter === cat
              const { icon: Icon, color } = CATEGORY_META[cat]

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex flex-col gap-2 rounded-2xl border px-4 py-4 text-left transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--sidebar-active)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]'
                  }`}
                  style={isActive ? { borderColor: color } : undefined}
                >
                  <Icon
                    size={22}
                    style={{ color }}
                  />
                  <div>
                    <p className={`text-sm font-semibold capitalize ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                      {t(CATEGORY_LABEL_KEYS[cat])}
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {t('templates.templateCount', { count })}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Featured Templates ────────────────────────────────────────── */}
        <section id="featured-section" className="pb-10">
          {/* Section header + platform pills */}
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="home-heading-font text-[2.75rem] font-bold tracking-[-0.035em] text-[var(--text-primary)]">
                {t('templates.sectionFeatured')}
              </h2>
              <p className="mt-2 text-[1rem] leading-relaxed text-[var(--text-secondary)]">
                {t('templates.sectionFeaturedSubtitle')}
              </p>
            </div>

            {/* Platform filter */}
            <div className="flex items-center gap-1">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatformFilter(p)}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                    platformFilter === p
                      ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {p === 'any' ? t('templates.filterAll') : p}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex h-[120px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-sm text-[var(--text-tertiary)]">
              No templates match your filters
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(template => (
                <FeaturedTemplateCard
                  key={template.id}
                  template={template}
                  onPreview={() => setPreviewTemplate(template)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Developer footer CTA ─────────────────────────────────────── */}
        <section className="border-t border-[var(--border-subtle)] py-16">
          <div className="flex items-center gap-12">
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/creator-banner.png"
                alt=""
                className="h-[220px] w-auto object-contain"
                aria-hidden
              />
            </div>
            <div>
              <h2 className="home-heading-font text-[2rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                Build your own connector
              </h2>
              <p className="mt-3 max-w-[420px] text-[1rem] leading-relaxed text-[var(--text-secondary)]">
                Create custom integrations for any platform and share them with the Inktide community — publish once, install on any Soul.
              </p>
              <Link
                href={MARKETPLACE_ROUTE}
                className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-opacity hover:opacity-70"
              >
                Browse marketplace
                <ArrowRight size={13} aria-hidden />
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* ── Modals / Drawers / Wizard ─────────────────────────────────── */}
      <AnimatePresence>
        {previewTemplate && (
          <TemplatePreviewDrawer
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onUse={() => {
              const tpl = previewTemplate
              setPreviewTemplate(null)
              setActiveTemplate(tpl)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeTemplate && (
          <ProjectTemplateWizard
            template={activeTemplate}
            souls={souls}
            onClose={() => setActiveTemplate(null)}
            onCreated={projectId => {
              setActiveTemplate(null)
              router.push(`/projects/${projectId}`)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <TemplateEditorModal mode="create" onClose={() => setShowCreateModal(false)} onSave={handleCreate} />
        )}
      </AnimatePresence>

    </div>
  )
}
