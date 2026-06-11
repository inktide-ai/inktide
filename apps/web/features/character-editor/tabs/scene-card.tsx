'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { ProjectSceneResponse } from '@/features/projects/api/scenes'
import { getEffectiveTagLabel, getSceneDisplayTitle, getTagDisplayStyleWithColor } from './scene-tag-utils'

const pgCard = 'relative bg-(--bg-card) border border-(--bg-card) rounded-[0.875rem] overflow-hidden cursor-pointer flex flex-col min-h-[188px] transition-[border-color,transform,box-shadow,background,opacity] duration-[180ms] select-none outline-none opacity-0 animate-[cardIn_0.32s_cubic-bezier(0.2,0.9,0.2,1)_forwards] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.35)] focus-visible:shadow-[0_0_0_2px_rgba(237,62,62,0.5)]'
const pgThumb = 'relative h-[124px] overflow-hidden shrink-0 before:content-[\'\'] before:absolute before:inset-0 before:z-[1] before:pointer-events-none'
const pgBody = 'flex flex-col flex-1 p-[0.625rem_0.875rem_0.75rem]'
const pgMeta = 'flex items-center gap-2 mb-1'
const pgName = 'text-body font-semibold text-(--text-primary) leading-[1.25] whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0'
const pgTag = 'text-caption font-semibold tracking-[0.03em] uppercase py-[2px] px-[6px] rounded-[4px] shrink-0 whitespace-nowrap'
const pgDesc = 'text-caption text-(--text-muted) leading-[1.45] mt-[0.1875rem] line-clamp-2'
const pgFooter = 'flex items-center justify-between mt-auto pt-[0.625rem]'
const pgRadioBase = 'w-[14px] h-[14px] rounded-full border-[1.5px] border-white/[0.16] shrink-0 transition-[border-color,background,box-shadow] duration-150'
const pgConfigureCls = 'inline-flex items-center gap-[3px] text-caption font-medium text-(--text-muted) bg-transparent border-none p-0 cursor-pointer font-[inherit] transition-[color] duration-150 leading-none no-underline'

interface SceneCardProps {
  scene: ProjectSceneResponse
  tagColorMap?: Map<string, string>
  isActive: boolean
  onSelect: () => void
  onConfigure: () => void
  onDelete: () => void
  deleting: boolean
  animationDelay?: number
}

export function SceneCard({ scene, tagColorMap, isActive, onSelect, onConfigure, onDelete, deleting, animationDelay = 0 }: SceneCardProps) {
  const { t } = useTranslation('scene')
  const [confirming, setConfirming] = useState(false)
  const [hovered, setHovered] = useState(false)

  const displayLabel = getEffectiveTagLabel(scene)
  const tagStyle = getTagDisplayStyleWithColor(displayLabel, tagColorMap?.get(displayLabel))
  const displayTitle = getSceneDisplayTitle(scene)
  const sizeBytes = scene.size_bytes ?? 0
  const sizeLabel = `${(sizeBytes / 1_048_576).toFixed(1)} MB`
  const nameTitle = `${scene.original_name} · ${sizeLabel} · ${scene.content_type}`
  const sceneDescription = scene.description?.trim() ?? ''

  const cardStyle: React.CSSProperties = isActive
    ? { borderColor: tagStyle.activeBorder, background: tagStyle.activeBg }
    : hovered ? { borderColor: tagStyle.border } : {}

  return (
    <div
      className={pgCard}
      style={{ animationDelay: `${animationDelay}ms`, ...cardStyle }}
      tabIndex={0}
      onClick={() => { if (!confirming) onSelect() }}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !confirming) { e.preventDefault(); onSelect() } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={isActive}
    >
      <div className={pgThumb}>
        {scene.public_url ? (
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${scene.public_url})` }} />
        ) : (
          <>
            <div className="absolute inset-0 bg-(--bg-card)" />
            <div className="absolute rounded-full blur-[32px] pointer-events-none" style={{ width: 110, height: 110, top: -25, left: '5%', background: 'rgba(139,92,246,.28)' }} />
            <div className="absolute rounded-full blur-[32px] pointer-events-none" style={{ width: 80, height: 80, bottom: -15, right: '5%', background: 'rgba(34,211,238,.18)' }} />
            <div className="absolute rounded-full blur-[32px] pointer-events-none" style={{ width: 60, height: 60, top: 5, right: '22%', background: 'rgba(236,72,153,.13)' }} />
          </>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, zIndex: 2, background: 'linear-gradient(transparent, var(--bg-card, #13151a))', pointerEvents: 'none' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[3]">
          <div className="w-[26px] h-[62px] rounded-[13px_13px_0_0] border border-white/[0.08] border-b-0 relative" style={{ background: 'linear-gradient(180deg, rgba(139,92,246,.12), rgba(139,92,246,.03))' }} />
        </div>
        <button
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-[8px] bg-[rgba(10,4,4,0.65)] border border-[rgba(248,113,113,0.18)] backdrop-blur-[6px] flex items-center justify-center text-[rgba(248,113,113,0.65)] cursor-pointer opacity-0 transition-[opacity,background,color,transform,border-color] duration-150 p-0 [.group:hover_&]:opacity-100 hover:bg-[rgba(248,113,113,0.18)] hover:text-[var(--color-error-mid)] hover:border-[rgba(248,113,113,0.35)] hover:scale-[1.08] active:scale-[0.94] disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('card.delete')} aria-label={t('card.delete')}
          onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
          disabled={deleting}
          style={{ opacity: hovered ? 1 : undefined }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M3.5 3.5l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className={pgBody}>
        <div className={pgMeta}>
          <div className={pgName} title={nameTitle}>{displayTitle}</div>
          <span className={pgTag} style={{ color: tagStyle.text, background: tagStyle.bg, border: `1px solid ${tagStyle.border}` }}>
            {displayLabel}
          </span>
        </div>
        {sceneDescription ? <div className={pgDesc}>{sceneDescription}</div> : null}
        <div className={pgFooter}>
          <div className={cn(pgRadioBase, isActive && 'border-[var(--color-online)] bg-[var(--color-online)] shadow-[0_0_0_3px_rgba(34,197,94,0.18)]')} />
          <button className={pgConfigureCls} onClick={(e) => { e.stopPropagation(); onConfigure() }} tabIndex={-1}>
            {t('card.configure')}
            <span className="opacity-0 -translate-x-[3px] transition-[opacity,transform] duration-150 flex items-center" style={{ opacity: hovered ? 1 : undefined, transform: hovered ? 'translateX(0)' : undefined }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {confirming && (
        <div className="absolute inset-0 z-[20] bg-[rgba(6,4,12,0.9)] backdrop-blur-[3px] flex flex-col items-center justify-center gap-[6px] p-[14px_12px_12px] rounded-[inherit] animate-[cardOverlayIn_0.14s_ease]" onClick={(e) => { e.stopPropagation(); setConfirming(false) }}>
          <div className="text-body font-bold text-(--text-primary) tracking-[-0.01em] text-center leading-[1.2]">{displayTitle}</div>
          <div className="text-caption text-(--text-muted) leading-[1.45] text-center px-1">{t('card.deleteConfirm')}<br />{t('card.deleteDesc')}.</div>
          <div className="flex gap-[7px] w-full mt-[6px]">
            <button className="flex-1 py-2 px-1 text-xs font-semibold text-(--text-secondary) bg-transparent border border-white/[0.14] rounded-[9px] cursor-pointer font-[inherit] transition-[background,color,border-color] duration-150 hover:bg-white/[0.09] hover:border-white/22 hover:text-(--text-primary)" onClick={(e) => { e.stopPropagation(); setConfirming(false) }}>{t('card.cancel')}</button>
            <button className="flex-1 py-2 px-1 text-xs font-semibold text-(--text-secondary) bg-transparent border border-white/[0.14] rounded-[9px] cursor-pointer font-[inherit] transition-[background,color,border-color] duration-150 hover:bg-white/[0.09] hover:border-white/22 hover:text-(--text-primary)" onClick={(e) => { e.stopPropagation(); setConfirming(false); onDelete() }} disabled={deleting}>{deleting ? '…' : t('card.delete')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
