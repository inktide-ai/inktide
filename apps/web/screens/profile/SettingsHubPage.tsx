'use client'
import { useState, useEffect } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import type { CSSProperties, ReactNode } from 'react'
import { GridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout'
import type { LayoutItem, Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { cn } from '@/lib/utils'
import {
  IconUser, IconSkills, IconBrain, IconMicrophone, IconPaint,
  IconIntegration, IconScene, IconMemory, IconObs,
} from '@/features/character-editor/tab-icons'
import { Grid } from '@/components/icons'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { getBannerAccent } from '@/shared/ui/banner-presets'
import { type HubTabId, type CardLayout, useHubLayout } from '@/shared/hooks/useHubLayout'
import { profileSettingsPath } from '@/lib/routes'
import SettingsInspectorPanel from '../../components/settings/SettingsInspectorPanel'

const HUB_LINKS: { to: string; tabId: HubTabId; icon: ReactNode }[] = [
  { to: profileSettingsPath('identity'),     tabId: 'profile',    icon: <IconUser /> },
  { to: profileSettingsPath('skills'),       tabId: 'skills',     icon: <IconSkills /> },
  { to: profileSettingsPath('model'),        tabId: 'avatars',    icon: <IconPaint /> },
  { to: profileSettingsPath('scene'),        tabId: 'scene',      icon: <IconScene /> },
  { to: profileSettingsPath('memory'),       tabId: 'memory',     icon: <IconMemory /> },
  { to: profileSettingsPath('brain'),        tabId: 'brain',      icon: <IconBrain /> },
  { to: profileSettingsPath('voice'),        tabId: 'voice',      icon: <IconMicrophone /> },
  { to: profileSettingsPath('channels'), tabId: 'connection', icon: <IconIntegration /> },
  { to: profileSettingsPath('obs'),          tabId: 'obs',        icon: <IconObs /> },
]

const LINK_MAP = Object.fromEntries(HUB_LINKS.map(l => [l.tabId, l])) as Record<HubTabId, (typeof HUB_LINKS)[0]>

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

type TagCategory = 'discord' | 'twitch' | 'channel' | 'tts' | 'llm' | 'memory' | 'autopilot'

const TAG_PALETTE: Record<TagCategory, [string, string]> = {
  discord:   ['88,101,242',  '#818cf8'],
  twitch:    ['145,70,255',  '#c084fc'],
  channel:   ['99,102,241',  '#a5b4fc'],
  tts:       ['16,185,129',  '#34d399'],
  llm:       ['6,182,212',   '#22d3ee'],
  memory:    ['139,92,246',  '#a78bfa'],
  autopilot: ['245,158,11',  '#fbbf24'],
}

function tagStyle(cat: TagCategory): CSSProperties {
  const [rgb, text] = TAG_PALETTE[cat]
  return { background: `rgba(${rgb}, 0.1)`, borderColor: `rgba(${rgb}, 0.2)`, color: text }
}

interface TagItem { label: string; style: CSSProperties }

const SIZES: { w: number; h: number; label: string }[] = [
  { w: 1, h: 1, label: '1×1' }, { w: 1, h: 2, label: '1×2' },
  { w: 2, h: 1, label: '2×1' }, { w: 2, h: 2, label: '2×2' },
]

function SizeIcon({ w, h }: { w: number; h: number }) {
  const C = 9, G = 2
  return (
    <svg width={2 * C + G} height={2 * C + G} viewBox={`0 0 ${2 * C + G} ${2 * C + G}`} fill="none">
      {[0, 1].flatMap(col => [0, 1].map(row => (
        <rect key={`${col}${row}`} x={col * (C + G)} y={row * (C + G)} width={C} height={C} rx={1.5}
          fill={col < w && row < h ? 'currentColor' : 'rgba(255,255,255,0.1)'} />
      )))}
    </svg>
  )
}

function GridIcon() {
  return <Grid size={13} />
}

export default function SettingsHubPage() {
  const { t } = useTranslation(['common', 'profile'])
  const { selected, loading, loadError } = useCharactersContext()
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeMenu, setActiveMenu] = useState<HubTabId | null>(null)
  const [selectedInspector, setSelectedInspector] = useState<HubTabId | null>(null)
  const { layout, updateLayout, resetLayout } = useHubLayout(selected?.id ?? '')
  const { width, containerRef } = useContainerWidth({ initialWidth: 1100 })

  useEffect(() => {
    if (!activeMenu) return
    const close = () => setActiveMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [activeMenu])

  if (loading) {
    return (
      <div className="text-center py-16 px-8 text-(--text-muted)">
        <div className="inline-block w-6 h-6 border-2 border-(--border) border-t-(--accent-red) rounded-full animate-spin mb-4" />
        <div className="text-[0.875rem]">{t('common:emptyState.loadingCharacters')}</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="text-center py-16 px-8 text-(--text-muted)">
        <div className="text-[3rem] mb-4 opacity-40">⚠</div>
        <div className="text-[1.125rem] font-bold text-(--text-primary) mb-2">{t('common:emptyState.failedToLoad')}</div>
        <p className="text-[0.8125rem] max-w-[360px] mx-auto leading-relaxed">{loadError}</p>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="text-center py-16 px-8 text-(--text-muted)">
        <div className="text-[3rem] mb-4 opacity-40">🤖</div>
        <div className="text-[1.125rem] font-bold text-(--text-primary) mb-2">{t('common:emptyState.selectCharacter')}</div>
        <p className="text-[0.8125rem] max-w-[360px] mx-auto leading-relaxed">{t('common:emptyState.selectCharacterDesc')}</p>
      </div>
    )
  }

  const accentColor = getBannerAccent(selected.appearance.bannerColorIndex)

  const tags: TagItem[] = [
    ...selected.channels.map(ch => {
      const p = ch.platform.toLowerCase()
      const cat: TagCategory = p === 'discord' ? 'discord' : p === 'twitch' ? 'twitch' : 'channel'
      return { label: capitalize(ch.platform), style: tagStyle(cat) }
    }),
    selected.tts.providerId ? { label: capitalize(selected.tts.providerId), style: tagStyle('tts') } : null,
    selected.llm.modelId ? { label: selected.llm.modelId, style: tagStyle('llm') } : null,
    selected.memory.enabled ? { label: 'Memory', style: tagStyle('memory') } : null,
    selected.autoPilot.enabled ? { label: 'AutoPilot', style: tagStyle('autopilot') } : null,
  ].filter(Boolean) as TagItem[]

  function handleLayoutChange(newLayout: Layout) {
    const updated: CardLayout[] = (newLayout as LayoutItem[]).map(item => ({
      i: item.i as HubTabId, x: item.x, y: item.y, w: item.w, h: item.h,
    }))
    updateLayout(updated)
  }

  function handleSizeChange(tabId: HubTabId, w: number, h: number) {
    updateLayout(layout.map(item => item.i === tabId ? { ...item, w, h } : item))
    setActiveMenu(null)
  }

  return (
    <div className="flex h-full">
      {/* ── Left: scrollable cards area ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">

      {/* Hub character card */}
      <div className="flex items-center gap-5 p-5 px-6 bg-white/[0.025] border border-white/[0.08] rounded-[0.875rem] max-w-[1100px] mx-auto w-full mb-4">
        <div className="w-[52px] h-[52px] rounded-lg shrink-0 flex items-center justify-center overflow-hidden" style={{ background: selected.appearance.avatarUrl ? undefined : accentColor }}>
          {selected.appearance.avatarUrl ? (
            <img src={selected.appearance.avatarUrl} alt={selected.name} className="w-full h-full object-cover rounded-[inherit]" />
          ) : (
            <span className="text-[1.375rem] font-bold text-white/90">{selected.name[0]?.toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-start gap-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[1rem] font-bold text-(--text-primary) leading-[1.2]">{selected.name}</span>
              <span className="text-[0.8125rem] text-(--text-muted)">/{selected.slug}</span>
            </div>
          </div>
          {selected.personality && (
            <p className="text-[0.8125rem] text-(--text-muted) leading-relaxed m-0 whitespace-nowrap overflow-hidden text-ellipsis">{selected.personality}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-[0.3125rem]">
              {tags.map(tag => (
                <span key={tag.label} className="py-[0.1875rem] px-2 bg-white/[0.055] border border-white/[0.07] rounded-full text-[0.6875rem] font-medium text-(--text-muted) whitespace-nowrap" style={tag.style}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 ml-auto flex items-center gap-0 pl-6">
          <div className="flex flex-col items-center text-center px-4">
            <span className="text-[1.75rem] font-bold text-(--text-primary) leading-none block">{HUB_LINKS.length}</span>
            <span className="text-[0.6875rem] text-(--text-muted) mt-[0.2rem]">settings</span>
          </div>
          <div className="w-px h-8 bg-white/[0.07] shrink-0" />
          <div className="flex flex-col items-center text-center px-4">
            <span className="text-[1.75rem] font-bold text-(--text-primary) leading-none block">{selected.channels.length}</span>
            <span className="text-[0.6875rem] text-(--text-muted) mt-[0.2rem]">channels</span>
          </div>
        </div>
      </div>

      {/* Tab cards grid — uses global .tab-cards-grid + .tab-card CSS */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={cn('tab-cards-grid', isEditMode && 'tab-cards-grid-editing')}
      >
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: 4, rowHeight: 170, margin: [12, 12], containerPadding: [0, 0] }}
          dragConfig={{ enabled: isEditMode }}
          resizeConfig={{ enabled: isEditMode, handles: ['se'] }}
          compactor={verticalCompactor}
          onLayoutChange={handleLayoutChange}
        >
          {layout.map(item => {
            const link = LINK_MAP[item.i]
            return (
              <div key={item.i} style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div
                  data-tabid={item.i}
                  className={cn(
                    'tab-card',
                    isEditMode && 'tab-card-editing',
                    !isEditMode && selectedInspector === item.i && 'tab-card-active',
                  )}
                  onClick={() => !isEditMode && setSelectedInspector(prev => prev === item.i ? null : item.i)}
                >
                  <div className="tab-card-icon flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.08] text-white/80 shrink-0 relative z-[2] [&>svg]:w-4 [&>svg]:h-4">
                    {link.icon}
                  </div>
                  <div className="tab-card-ghost absolute top-[0.875rem] right-[0.875rem] w-[90px] h-[90px] text-white/[0.045] flex items-center justify-center pointer-events-none z-0 [&>svg]:w-[90px] [&>svg]:h-[90px]" aria-hidden>
                    {link.icon}
                  </div>
                  <div className="tab-card-body relative z-[2] min-w-0">
                    <div className="tab-card-label text-[0.9375rem] font-semibold text-white/88 tracking-[-0.01em] mb-[0.3rem]">
                      {t(`profile:tabs.${item.i}.label` as const)}
                    </div>
                    <div className="tab-card-desc text-[0.8125rem] text-white/36 leading-[1.45] pr-6">
                      {t(`profile:tabs.${item.i}.desc` as const)}
                    </div>
                  </div>
                </div>
                {isEditMode && (
                  <>
                    <button
                      className="absolute top-2 right-2 w-[26px] h-[26px] rounded-[6px] bg-black/35 border border-white/12 text-white/50 cursor-pointer flex items-center justify-center z-[20] transition-[background,color,border-color] duration-150 backdrop-blur-[6px] hover:bg-[rgba(99,102,241,0.2)] hover:border-[rgba(99,102,241,0.4)] hover:text-[#a5b4fc]"
                      onClick={e => { e.stopPropagation(); setActiveMenu(prev => prev === item.i ? null : item.i) }}
                    >
                      <GridIcon />
                    </button>
                    {activeMenu === item.i && (
                      <div
                        className="absolute top-[38px] right-2 bg-[rgba(14,14,22,0.96)] border border-white/12 rounded-xl p-2 grid grid-cols-2 gap-[6px] z-[200] shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-[20px] animate-[sizeMenuIn_0.12s_ease]"
                        onClick={e => e.stopPropagation()}
                      >
                        {SIZES.map(({ w, h, label }) => (
                          <button
                            key={label}
                            className={cn(
                              'flex flex-col items-center gap-[5px] py-2 px-[10px] rounded-[8px] bg-transparent border border-white/[0.07] text-white/45 cursor-pointer text-[10px] font-semibold tracking-[0.03em] transition-all duration-[120ms] whitespace-nowrap hover:bg-white/[0.06] hover:border-white/[0.15] hover:text-white/85',
                              item.w === w && item.h === h && 'bg-[rgba(99,102,241,0.15)] border-[rgba(99,102,241,0.45)] text-[#a5b4fc]',
                            )}
                            onClick={() => handleSizeChange(item.i, w, h)}
                          >
                            <SizeIcon w={w} h={h} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </GridLayout>
      </div>

      {/* Edit mode bar */}
      <div className="flex justify-end items-center gap-[0.625rem] max-w-[1100px] mx-auto w-full pt-6 pb-8">
        {isEditMode && (
          <button
            className="inline-flex items-center py-2 px-4 bg-[rgba(15,15,20,0.7)] border border-white/[0.07] rounded-full text-white/35 font-[var(--font-ui)] text-[0.8125rem] cursor-pointer transition-all duration-150 backdrop-blur-[8px] hover:border-[rgba(244,63,94,0.35)] hover:text-[rgba(244,63,94,0.75)] hover:bg-[rgba(244,63,94,0.05)]"
            onClick={() => resetLayout()}
          >
            Reset to default
          </button>
        )}
        <button
          className={cn(
            'inline-flex items-center gap-1.5 py-2 px-[1.125rem] bg-[rgba(15,15,20,0.85)] border border-white/10 rounded-full text-white/65 font-[var(--font-ui)] text-[0.8125rem] font-medium cursor-pointer transition-all duration-150 ease backdrop-blur-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:bg-[rgba(30,30,40,0.9)] hover:border-white/[0.18] hover:text-white/90',
            isEditMode && 'bg-[rgba(99,102,241,0.15)] border-[rgba(99,102,241,0.4)] text-[#a5b4fc] hover:bg-[rgba(99,102,241,0.25)] hover:border-[rgba(99,102,241,0.55)]',
          )}
          onClick={() => setIsEditMode(prev => !prev)}
        >
          {isEditMode ? 'Done' : 'Edit layout'}
        </button>
      </div>

      </div>{/* end scrollable cards area */}

      {/* ── Right: inspector panel ────────────────────────────────────── */}
      {selectedInspector && (
        <SettingsInspectorPanel
          tabId={selectedInspector}
          onClose={() => setSelectedInspector(null)}
        />
      )}
    </div>
  )
}
