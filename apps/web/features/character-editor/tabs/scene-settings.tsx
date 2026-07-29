'use client'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { ProjectSceneResponse } from '@/features/projects/api/scenes'
import type { AiCharacter } from '@/shared/lib/character'
import { inferModelType } from '@/shared/lib/utils/model-type'
import { AvatarRenderer } from '@/features/avatar' // fsd:cross-feature-ok - editor embeds avatar preview
import { useCardModel } from '@/entities/soul/hooks'
import { useSceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'
import { getSceneDisplayTitle } from './scene-tag-utils'
import SceneRendererPanel from './scene-renderer-panel'
import { useSceneSettings, MAX_DISPLAY, MAX_DESC, ALLOWED_TYPES } from '../hooks/useSceneSettings'

// Shared style strings
const backBtn = 'inline-flex items-center gap-[0.4rem] py-[0.4rem] px-[0.625rem] mb-6 -ml-[0.625rem] bg-transparent border border-transparent rounded-lg text-(--text-muted) font-[inherit] text-sm font-medium cursor-pointer transition-[color,background,border-color] duration-150 self-start hover:text-(--text-primary) hover:bg-white/[0.05] hover:border-white/[0.07]'
const btnGhost = 'text-[11.5px] font-medium text-(--text-muted) bg-transparent border border-white/[0.07] rounded-[6px] py-[5px] px-[11px] cursor-pointer font-[inherit] transition-[color,background,border-color] duration-150 hover:text-(--text-primary) hover:border-white/12 hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed'
const btnDanger = 'text-[11.5px] font-medium text-[var(--color-error-mid)]/65 bg-transparent border border-[var(--color-error-mid)]/14 rounded-[6px] py-[5px] px-[11px] cursor-pointer font-[inherit] transition-[color,background,border-color] duration-150 hover:text-[var(--color-error-mid)] hover:border-[var(--color-error-mid)]/30 hover:bg-[var(--color-error-mid)]/7 disabled:opacity-50 disabled:cursor-not-allowed'
const sectionHdr = 'flex items-center gap-[10px] mb-3'
const sectionLbl = 'text-2xs font-semibold tracking-[0.09em] uppercase text-(--text-muted) whitespace-nowrap'
const sectionLine = 'flex-1 h-px bg-white/[0.07]'
const modalFieldLabel = 'text-body font-medium tracking-[0.07em] uppercase text-white/35 mb-2 flex items-center gap-[6px]'
const modalTextInput = 'w-full bg-white/[0.05] border border-[0.5px] border-white/12 rounded-[10px] p-[11px_14px] text-body text-(--text-primary) outline-none font-[inherit] transition-[border-color] duration-150 placeholder:text-white/25 focus:border-white/30'
const modalCharCount = 'text-body text-white/25 text-right mt-1'
const modalDescInput = 'w-full bg-white/[0.05] border border-[0.5px] border-white/12 rounded-[10px] p-[11px_14px] text-body text-(--text-primary) outline-none font-[inherit] resize-none h-[72px] transition-[border-color] duration-150 leading-relaxed placeholder:text-white/25 focus:border-white/30'
const uploadPlaceholder = 'flex items-center justify-center flex-col gap-2 p-[22px] bg-white/[0.015] border border-dashed border-white/[0.07] rounded-[10px] cursor-pointer transition-[border-color,background] duration-150 hover:border-white/12 hover:bg-white/[0.025]'
const toolbarBtnBase = 'absolute w-9 h-9 rounded-[10px] bg-[rgba(18,18,22,0.72)] border border-white/10 backdrop-blur-[10px] flex items-center justify-center cursor-pointer text-white/60 transition-[background,transform,color,border-color] duration-150 z-10 p-0'

interface SceneSettingsProps {
  character: AiCharacter
  scene: ProjectSceneResponse | null
  projectId?: string
  onBack: () => void
  onScenesChanged: () => void
  onSceneReplaced?: (newSceneId: string) => void
  onSceneDeleted: () => void
}

export function SceneSettings({ character, scene, projectId, onBack, onScenesChanged, onSceneReplaced, onSceneDeleted }: SceneSettingsProps) {
  const { t } = useTranslation('scene')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cardId = undefined // scene settings no longer has cardId - model preview not available
  const { model, loading: modelLoading, error: modelError } = useCardModel(cardId)
  const effectiveModelType = model ? inferModelType(model.original_file_name, model.content_type) : character.appearance.modelType
  const hasAvatarModel = Boolean(model?.public_url)

  // Pure UI toggles - renderer/model visibility, not related to data loading
  const [modelVisible, setModelVisible] = useState(true)
  const [rendererPanelOpen, setRendererPanelOpen] = useState(false)

  const { settings, setSettings, resetSettings } = useSceneRendererSettings(projectId ?? '')

  const {
    uploading, removing, error,
    metaDisplayName, setMetaDisplayName,
    metaDescription, setMetaDescription,
    metaSaving, metaError,
    handleSaveMeta, handleReplace, handleUploadNew, handleDelete,
  } = useSceneSettings({ scene, projectId, fileInputRef, onScenesChanged, onSceneReplaced, onSceneDeleted })

  const pageHeading = scene ? getSceneDisplayTitle(scene) : t('settings.untitled')
  const sizeLabel = scene ? `${scene.original_name} · ${((scene.size_bytes ?? 0) / 1_048_576).toFixed(1)} MB` : ''

  return (
    <div className="flex flex-col animate-[pageIn_0.22s_cubic-bezier(0.2,0.9,0.2,1)]">
      <button type="button" className={backBtn} onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {t('settings.back')}
      </button>

      <div className="text-[1.3125rem] font-bold tracking-[-0.02em] text-(--text-primary) mb-[0.3rem]">{t('settings.titlePrefix')} {pageHeading}</div>
      <div className="text-[0.775rem] text-(--text-muted) mb-7 leading-relaxed">{t('settings.subtitle')}</div>

      {/* Scene banner */}
      <div className={cn('relative w-full rounded-xl overflow-hidden border border-white/[0.07] mb-7', !scene?.public_url && 'min-h-[130px]')}>
        {scene?.public_url ? (
          <img src={scene.public_url} alt="" className="block w-full h-auto" decoding="async" />
        ) : (
          <div className="absolute inset-0 bg-[#08060f]" aria-hidden />
        )}

        {!scene?.public_url && (
          <>
            <div className="absolute rounded-full blur-[36px] pointer-events-none" style={{ width: 180, height: 180, top: -30, left: '18%', background: 'rgba(139,92,246,.24)' }} />
            <div className="absolute rounded-full blur-[36px] pointer-events-none" style={{ width: 130, height: 130, bottom: -20, right: '12%', background: 'rgba(34,211,238,.16)' }} />
            <div className="absolute rounded-full blur-[36px] pointer-events-none" style={{ width: 90, height: 90, top: 20, right: 20, background: 'rgba(236,72,153,.12)' }} />
          </>
        )}

        {hasAvatarModel && !modelLoading && !modelError && (
          <div className="absolute inset-0 z-[2] pointer-events-auto">
            <AvatarRenderer className="absolute inset-0 w-full h-full" modelType={effectiveModelType} modelUrl={model?.public_url ?? null} background="transparent" modelVisible={modelVisible} rendererSettings={settings} />
          </div>
        )}
        {modelLoading && (
          <div className="absolute inset-0 z-[4] flex items-center justify-center bg-black/20 pointer-events-none" aria-busy="true">
            <div className="w-7 h-7 border-2 border-white/[0.12] border-t-white/65 rounded-full animate-spin" />
          </div>
        )}
        {modelError && (
          <div className="absolute inset-0 z-[4] flex items-center justify-center p-4 text-center text-[0.78rem] text-[var(--color-error-mid)] bg-black/35 pointer-events-none">{t('settings.modelPreviewError')}</div>
        )}

        {/* Renderer toggle btn */}
        <button type="button" className={cn(toolbarBtnBase, 'top-[10px] right-[54px] hover:bg-[rgba(102,178,255,0.18)] hover:text-white/90 hover:border-[rgba(102,178,255,0.3)] hover:scale-[1.06] active:scale-[0.96]', rendererPanelOpen && 'bg-[rgba(102,178,255,0.18)] text-[#66b2ff] border-[rgba(102,178,255,0.35)]')} title="Настройки рендера" aria-label="Настройки рендера" aria-pressed={rendererPanelOpen} onClick={() => setRendererPanelOpen(v => !v)}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>

        {/* Model toggle btn */}
        <button type="button" className={cn(toolbarBtnBase, 'top-[10px] right-[10px] hover:bg-[rgba(255,129,129,0.18)] hover:text-white/90 hover:border-[rgba(255,129,129,0.3)] hover:scale-[1.06] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-55', !hasAvatarModel || !modelVisible ? 'text-white/25 bg-[rgba(18,18,22,0.55)] border-white/[0.06]' : '')} title={hasAvatarModel ? t('toolbar.toggleModel') : t('settings.previewNeedsModel')} aria-label={hasAvatarModel ? t('toolbar.toggleModel') : t('settings.previewNeedsModel')} aria-pressed={hasAvatarModel ? !modelVisible : undefined} disabled={!hasAvatarModel || !!modelLoading || !!modelError} onClick={() => hasAvatarModel && setModelVisible(v => !v)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" /><path d="M4 15c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        </button>

        {rendererPanelOpen && <SceneRendererPanel settings={settings} onSet={setSettings} onReset={resetSettings} />}
      </div>

      {/* Env section */}
      <div className={sectionHdr}>
        <span className={sectionLbl}>{t('settings.envSection')}</span>
        <div className={sectionLine} />
      </div>

      {scene ? (
        <div className="flex items-center gap-[14px] p-[12px_14px] bg-white/[0.02] border border-white/[0.07] rounded-[10px] transition-[border-color,background] duration-150 hover:border-white/12 hover:bg-white/[0.025]">
          <div className="w-12 h-12 rounded-[8px] overflow-hidden shrink-0 border border-white/[0.07]">
            <div className="w-full h-full block bg-cover bg-center" style={scene.public_url ? { backgroundImage: `url(${scene.public_url})` } : { background: 'linear-gradient(135deg,#1a0a2e 0%,#0d1117 50%,#091420 100%)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-body font-semibold text-(--text-secondary) tracking-[-0.01em] mb-[3px]">{t('settings.bgTitle')}</div>
            <div className="text-[10.5px] text-(--text-muted) whitespace-nowrap overflow-hidden text-ellipsis">{sizeLabel}</div>
          </div>
          <div className="flex gap-[6px] shrink-0">
            <button type="button" className={btnGhost} onClick={() => fileInputRef.current?.click()} disabled={uploading || removing || !projectId}>{uploading ? t('settings.replacing') : t('settings.replace')}</button>
            <button type="button" className={btnDanger} onClick={handleDelete} disabled={removing || uploading || !projectId}>{removing ? t('settings.removing') : t('settings.delete')}</button>
          </div>
        </div>
      ) : (
        <div className={uploadPlaceholder} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}>
          <div className="text-(--text-muted) flex">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M11 7v8M7 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </div>
          <div className="text-body font-medium text-(--text-muted)">{uploading ? t('settings.uploading') : t('settings.noImage')}</div>
          <div className="text-[10.5px] text-white/20">{t('settings.noImageHint')}</div>
        </div>
      )}

      {error && <div className="mt-3 text-xs text-[var(--color-error-mid)]">{error}</div>}

      {scene && projectId && (
        <>
          <div className={cn(sectionHdr, 'mt-[1.375rem]')}>
            <span className={sectionLbl}>{t('settings.metaSection')}</span>
            <div className={sectionLine} />
          </div>

          <div className="flex flex-col gap-4 mb-1">
            <div>
              <div className={modalFieldLabel}>{t('settings.metaName')}</div>
              <input className={modalTextInput} value={metaDisplayName} onChange={e => setMetaDisplayName(e.target.value.slice(0, MAX_DISPLAY))} maxLength={MAX_DISPLAY} placeholder={t('settings.metaNamePlaceholder')} />
              <div className={modalCharCount}>{metaDisplayName.length}/{MAX_DISPLAY}</div>
            </div>
            <div>
              <div className={modalFieldLabel}>{t('settings.metaDesc')}</div>
              <textarea className={modalDescInput} value={metaDescription} onChange={e => setMetaDescription(e.target.value.slice(0, MAX_DESC))} maxLength={MAX_DESC} placeholder={t('settings.metaDescPlaceholder')} rows={4} />
              <div className={modalCharCount}>{metaDescription.length}/{MAX_DESC}</div>
            </div>
            {metaError && <div className="mt-3 text-xs text-[var(--color-error-mid)]">{metaError}</div>}
            <div className="flex flex-wrap gap-2 mt-1">
              <button type="button" className="flex-[2] p-[11px] rounded-[10px] bg-[#7c3aed] border-none text-white text-body font-medium cursor-pointer font-[inherit] transition-[background] duration-[120ms] hover:enabled:bg-[#6d28d9] disabled:bg-[rgba(124,58,237,0.3)] disabled:text-white/30 disabled:cursor-not-allowed" onClick={() => void handleSaveMeta()} disabled={metaSaving}>
                {metaSaving ? t('settings.savingMeta') : t('settings.saveMeta')}
              </button>
            </div>
          </div>
        </>
      )}

      <div className={cn(sectionHdr, 'mt-[1.375rem]')}>
        <span className={sectionLbl}>{t('settings.additionalSection')}</span>
        <div className={sectionLine} />
      </div>

      <div className="flex items-center gap-[11px] p-[12px_14px] bg-white/[0.012] border border-dashed border-white/[0.06] rounded-[9px]">
        <div className="w-7 h-7 rounded-[6px] bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" /><path d="M6.5 3.5v3l1.8 1.4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </div>
        <span className="text-body font-medium text-(--text-muted) flex-1">{t('settings.comingSoon')}</span>
        <span className="text-[9.5px] font-semibold tracking-[0.05em] uppercase text-[rgba(251,191,36,0.65)] bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.16)] rounded-[4px] py-[2px] px-[7px] shrink-0">{t('settings.comingSoonBadge')}</span>
      </div>

      <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES} className="hidden" onChange={scene ? handleReplace : handleUploadNew} />
    </div>
  )
}
