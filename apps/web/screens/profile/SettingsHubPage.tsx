'use client'
import { useState, useEffect } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import type { CSSProperties, ReactNode } from 'react'
import { GridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout'
import type { LayoutItem, Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
  IconUser, IconSkills, IconBrain, IconMicrophone, IconPaint,
  IconIntegration, IconScene, IconMemory, IconBackup, IconObs,
} from '../../components/ProfilePage/TabIcons'
import { useCharactersContext } from '../../context/CharactersContext'
import { profileSettingsPath } from '@/lib/routes'
import { getBannerAccent } from '../../components/ProfilePage/bannerPresets'
import styles from '../../components/ProfilePage/ProfilePage.module.css'
import { type HubTabId, type CardLayout, useHubLayout } from '../../hooks/useHubLayout'

const HUB_LINKS: { to: string; tabId: HubTabId; icon: ReactNode }[] = [
  { to: profileSettingsPath('identity'),     tabId: 'profile',    icon: <IconUser /> },
  { to: profileSettingsPath('skills'),       tabId: 'skills',     icon: <IconSkills /> },
  { to: profileSettingsPath('model'),        tabId: 'avatars',    icon: <IconPaint /> },
  { to: profileSettingsPath('scene'),        tabId: 'scene',      icon: <IconScene /> },
  { to: profileSettingsPath('memory'),       tabId: 'memory',     icon: <IconMemory /> },
  { to: profileSettingsPath('brain'),        tabId: 'brain',      icon: <IconBrain /> },
  { to: profileSettingsPath('voice'),        tabId: 'voice',      icon: <IconMicrophone /> },
  { to: profileSettingsPath('integrations'), tabId: 'connection', icon: <IconIntegration /> },
  { to: profileSettingsPath('obs'),          tabId: 'obs',        icon: <IconObs /> },
  { to: profileSettingsPath('backup'),       tabId: 'backup',     icon: <IconBackup /> },
]

const LINK_MAP = Object.fromEntries(
  HUB_LINKS.map(l => [l.tabId, l])
) as Record<HubTabId, (typeof HUB_LINKS)[0]>

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

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
  return {
    background: `rgba(${rgb}, 0.1)`,
    borderColor: `rgba(${rgb}, 0.2)`,
    color: text,
  }
}

interface TagItem { label: string; style: CSSProperties }

const SIZES: { w: number; h: number; label: string }[] = [
  { w: 1, h: 1, label: '1×1' },
  { w: 1, h: 2, label: '1×2' },
  { w: 2, h: 1, label: '2×1' },
  { w: 2, h: 2, label: '2×2' },
]

function SizeIcon({ w, h }: { w: number; h: number }) {
  const C = 9, G = 2
  return (
    <svg width={2 * C + G} height={2 * C + G} viewBox={`0 0 ${2 * C + G} ${2 * C + G}`} fill="none">
      {[0, 1].flatMap(col => [0, 1].map(row => (
        <rect key={`${col}${row}`}
          x={col * (C + G)} y={row * (C + G)}
          width={C} height={C} rx={1.5}
          fill={col < w && row < h ? 'currentColor' : 'rgba(255,255,255,0.1)'}
        />
      )))}
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="0.5" y="0.5" width="5" height="5" rx="1" fill="currentColor"/>
      <rect x="7.5" y="0.5" width="5" height="5" rx="1" fill="currentColor"/>
      <rect x="0.5" y="7.5" width="5" height="5" rx="1" fill="currentColor"/>
      <rect x="7.5" y="7.5" width="5" height="5" rx="1" fill="currentColor"/>
    </svg>
  )
}

export default function SettingsHubPage() {
  const { t } = useTranslation(['common', 'profile'])
  const { selected, loading, loadError } = useCharactersContext()
  const router = useRouter()
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeMenu, setActiveMenu] = useState<HubTabId | null>(null)
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
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <div className={styles.loadingText}>{t('common:emptyState.loadingCharacters')}</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚠</div>
        <div className={styles.emptyTitle}>{t('common:emptyState.failedToLoad')}</div>
        <p className={styles.emptyText}>{loadError}</p>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🤖</div>
        <div className={styles.emptyTitle}>{t('common:emptyState.selectCharacter')}</div>
        <p className={styles.emptyText}>{t('common:emptyState.selectCharacterDesc')}</p>
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
    selected.tts.providerId
      ? { label: capitalize(selected.tts.providerId), style: tagStyle('tts') }
      : null,
    selected.llm.modelId
      ? { label: selected.llm.modelId, style: tagStyle('llm') }
      : null,
    selected.memory.enabled
      ? { label: 'Memory', style: tagStyle('memory') }
      : null,
    selected.autoPilot.enabled
      ? { label: 'AutoPilot', style: tagStyle('autopilot') }
      : null,
  ].filter(Boolean) as TagItem[]

  function handleLayoutChange(newLayout: Layout) {
    const updated: CardLayout[] = (newLayout as LayoutItem[]).map(item => ({
      i: item.i as HubTabId,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }))
    updateLayout(updated)
  }

  function handleSizeChange(tabId: HubTabId, w: number, h: number) {
    updateLayout(layout.map(item => item.i === tabId ? { ...item, w, h } : item))
    setActiveMenu(null)
  }

  return (
    <>
      <div className={styles.hubCharCard}>
        <div
          className={styles.hubCharCardAvatar}
          style={{ background: selected.appearance.avatarUrl ? undefined : accentColor }}
        >
          {selected.appearance.avatarUrl ? (
            <img
              src={selected.appearance.avatarUrl}
              alt={selected.name}
              className={styles.hubCharCardAvatarImg}
            />
          ) : (
            <span className={styles.hubCharCardAvatarLetter}>
              {selected.name[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <div className={styles.hubCharCardInfo}>
          <div className={styles.hubCharCardTop}>
            <div className={styles.hubCharCardNameBlock}>
              <span className={styles.hubCharCardName}>{selected.name}</span>
              <span className={styles.hubCharCardSlug}>/{selected.slug}</span>
            </div>
          </div>

          {selected.personality && (
            <p className={styles.hubCharCardDesc}>{selected.personality}</p>
          )}

          {tags.length > 0 && (
            <div className={styles.hubCharCardTags}>
              {tags.map(tag => (
                <span key={tag.label} className={styles.hubCharCardTag} style={tag.style}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.hubCharCardStats}>
          <div className={styles.hubCharCardStat}>
            <span className={styles.hubCharCardStatNum}>{HUB_LINKS.length}</span>
            <span className={styles.hubCharCardStatLabel}>settings</span>
          </div>
          <div className={styles.hubCharCardStatDivider} />
          <div className={styles.hubCharCardStat}>
            <span className={styles.hubCharCardStatNum}>{selected.channels.length}</span>
            <span className={styles.hubCharCardStatLabel}>integrations</span>
          </div>
        </div>
      </div>

      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={`${styles.tabCardsGrid} ${isEditMode ? styles.tabCardsGridEditing : ''}`}
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
                  className={`${styles.tabCard} ${isEditMode ? styles.tabCardEditing : ''}`}
                  onClick={() => !isEditMode && router.push(link.to)}
                >
                  <div className={styles.tabCardIcon}>{link.icon}</div>
                  <div className={styles.tabCardGhost} aria-hidden>{link.icon}</div>
                  <div className={styles.tabCardBody}>
                    <div className={styles.tabCardLabel}>{t(`profile:tabs.${item.i}.label` as const)}</div>
                    <div className={styles.tabCardDesc}>{t(`profile:tabs.${item.i}.desc` as const)}</div>
                  </div>
                </div>
                {isEditMode && (
                  <>
                    <button
                      className={styles.sizeMenuBtn}
                      onClick={e => { e.stopPropagation(); setActiveMenu(prev => prev === item.i ? null : item.i) }}
                    >
                      <GridIcon />
                    </button>
                    {activeMenu === item.i && (
                      <div className={styles.sizeMenu} onClick={e => e.stopPropagation()}>
                        {SIZES.map(({ w, h, label }) => (
                          <button
                            key={label}
                            className={`${styles.sizeOption} ${item.w === w && item.h === h ? styles.sizeOptionActive : ''}`}
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

      <div className={styles.editModeBar}>
        {isEditMode && (
          <button className={styles.resetBtn} onClick={() => resetLayout()}>
            Reset to default
          </button>
        )}
        <button
          className={`${styles.editModeBtn} ${isEditMode ? styles.editModeBtnActive : ''}`}
          onClick={() => setIsEditMode(prev => !prev)}
        >
          {isEditMode ? 'Done' : 'Edit layout'}
        </button>
      </div>
    </>
  )
}
