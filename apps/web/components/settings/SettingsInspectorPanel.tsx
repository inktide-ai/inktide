'use client'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { HubTabId } from '@/shared/hooks/useHubLayout'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { INSPECTOR_TAB_MAP } from './inspector-tab-map'

// Code </> icon from icon assets (fill → currentColor for theming)
const IconCode = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M13.5342 4.52734C13.6571 4.13203 14.0772 3.91146 14.4727 4.03418C14.8679 4.15716 15.0885 4.57723 14.9658 4.97266L10.4658 19.4727C10.3428 19.8678 9.9227 20.0885 9.52734 19.9658C9.13211 19.8429 8.91161 19.4227 9.03418 19.0273L13.5342 4.52734ZM5.71973 7.21973C6.01262 6.92683 6.48738 6.92683 6.78027 7.21973C7.07304 7.51263 7.07313 7.98742 6.78027 8.28027L3.56055 11.5L6.78027 14.7197C7.07304 15.0126 7.07313 15.4874 6.78027 15.7803C6.48741 16.073 6.01259 16.073 5.71973 15.7803L1.96973 12.0303C1.82913 11.8897 1.75006 11.6988 1.75 11.5C1.75 11.3011 1.82915 11.1104 1.96973 10.9697L5.71973 7.21973ZM16.9697 7.21973C17.2626 6.92683 17.7374 6.92683 18.0303 7.21973L21.7803 10.9697C21.9208 11.1104 22 11.3011 22 11.5C21.9999 11.6988 21.9209 11.8897 21.7803 12.0303L18.0303 15.7803C17.7374 16.073 17.2626 16.073 16.9697 15.7803C16.6769 15.4874 16.677 15.0126 16.9697 14.7197L20.1895 11.5L16.9697 8.28027C16.6769 7.98742 16.677 7.51263 16.9697 7.21973Z" fill="currentColor"/>
  </svg>
)

const MIN_WIDTH     = 240
const MAX_WIDTH     = 500
const DEFAULT_WIDTH = 260

const PANEL_BG = '#0F1117'
const BORDER   = 'rgba(255,255,255,0.06)'
const TEXT     = '#E6EAF2'
const HOVER_BG = 'rgba(255,255,255,0.06)'

interface Props {
  tabId: HubTabId
  onClose: () => void
}

export default function SettingsInspectorPanel({ tabId, onClose }: Props) {
  const { t } = useTranslation(['profile', 'common'])
  const { saveStatus, saveError } = useCharactersContext()
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH)

  const def = INSPECTOR_TAB_MAP[tabId]
  const { Component } = def
  const label = t(def.labelKey as never)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelWidth

    const onMove = (mv: MouseEvent) => {
      const delta = startX - mv.clientX
      setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + delta)))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelWidth])

  return (
    <div
      className="flex-shrink-0 flex flex-col h-full"
      style={{
        width: panelWidth,
        position: 'relative',
        background: PANEL_BG,
        borderLeft: `1px solid ${BORDER}`,
        animation: 'inspectorIn 0.2s cubic-bezier(0.22,1,0.36,1) both',
      }}
    >
      {/* ── Resize handle — left edge ───────────────────────────────────── */}
      <div
        onMouseDown={startResize}
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          cursor: 'col-resize', zIndex: 10,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      />
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 flex-shrink-0"
        style={{ height: 40, paddingLeft: 12, paddingRight: 8, borderBottom: `1px solid ${BORDER}` }}
      >
        {/* Colored icon — only when defined */}
        {def.icon && (
          <div
            data-tabid={tabId}
            className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 tab-card-icon [&>svg]:w-3.5 [&>svg]:h-3.5"
          >
            {def.icon}
          </div>
        )}

        <span
          className="flex-1 truncate text-[0.8125rem] font-semibold tracking-[-0.01em]"
          style={{ color: TEXT }}
        >
          {label}
        </span>

        {/* Code view — placeholder, no action yet */}
        <button
          type="button"
          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          style={{ color: TEXT }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          title="View code"
        >
          <IconCode />
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
          style={{ color: TEXT }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = HOVER_BG }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          title="Close (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <Component />
      </div>

      {/* Error toast — only shown on save failure */}
      {saveStatus === 'error' && (
        <div
          className="px-3 py-2 flex-shrink-0 text-[0.75rem]"
          style={{ borderTop: `1px solid ${BORDER}`, color: '#ef4444' }}
        >
          {saveError ?? t('common:saveBar.failed')}
        </div>
      )}
    </div>
  )
}
