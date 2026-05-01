'use client'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AvatarRenderer from '../../AvatarRenderer/AvatarRenderer'
import { useCardModel } from '../../AvatarRenderer/hooks/useCardModel'
import { useCardScene } from '../../AvatarRenderer/hooks/useCardScene'
import { useAudioStream } from '../../../hooks/useAudioStream'
import { useCardChannelId } from '../../../hooks/useCardChannelId'
import { useLipSync } from '../../../hooks/useLipSync'
import { useSceneRendererSettings } from '../../../hooks/useSceneRendererSettings'
import { useAuth } from '../../../context/AuthContext'
import type { AiCharacter, ModelType } from '@/lib/character'
import type { EmotionState } from '@/types/IVrmController'
import SceneChat from './SceneChat'
import SceneRendererPanel from './SceneRendererPanel'
import styles from './SceneFullscreen.module.css'

interface SceneFullscreenProps {
  character: AiCharacter
  cardId: string
  onOpenSettings?: () => void
}

function inferModelType(contentType: string, fileName: string): ModelType {
  if (fileName.endsWith('.vrm')) return 'vrm'
  if (contentType === 'model/gltf-binary' || fileName.endsWith('.glb')) return 'glb'
  return 'glb'
}

const SceneFullscreen = ({ character, cardId, onOpenSettings }: SceneFullscreenProps) => {
  const { user } = useAuth()
  const { t } = useTranslation('scene')
  const [modelVisible, setModelVisible] = useState(true)
  const [rendererPanelOpen, setRendererPanelOpen] = useState(false)
  const { model, loading, error } = useCardModel(cardId)
  const { scene } = useCardScene(cardId)
  const channelId = useCardChannelId(cardId)
  const lipSync = useLipSync()
  const { settings, setSettings, resetSettings } = useSceneRendererSettings(cardId)

  // Stream (OBS) channel emotion — active when viewers subscribe to the card channel
  const { getEmotionState: getStreamEmotion } = useAudioStream(channelId, { lipSync })

  // Personal chat channel emotion — populated by SceneChat once mounted
  const chatEmotionGetterRef = useRef<(() => EmotionState) | null>(null)

  // Prefer personal-chat emotion; fall back to stream channel emotion
  const getEmotionState = useCallback(
    (): EmotionState => chatEmotionGetterRef.current?.() ?? getStreamEmotion(),
    [getStreamEmotion],
  )

  const effectiveModelType = model
    ? inferModelType(model.content_type, model.original_file_name)
    : character.appearance.modelType

  const background = scene?.public_url ?? 'transparent'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: 'transparent' }}>
      {/* Dot grid — uniform across canvas, slight fade in center */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(48,48,46,1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 68% 58% at 50% 50%, transparent 15%, black 65%)',
          WebkitMaskImage: 'radial-gradient(ellipse 68% 58% at 50% 50%, transparent 15%, black 65%)',
        }}
      />
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', zIndex: 2 }}>
          {t('loading')}
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e05c5c', fontSize: '0.85rem', zIndex: 2 }}>
          {error}
        </div>
      )}
      {!loading && !error && (
        <div className={styles.sceneRendererWrap}>
          <AvatarRenderer
            modelType={effectiveModelType}
            modelUrl={model?.public_url ?? null}
            background={background}
            getMouthWeights={lipSync.getMouthWeights}
            modelVisible={modelVisible}
            rendererSettings={settings}
            getEmotionState={getEmotionState}
          />
        </div>
      )}

      {user && (
        <SceneChat
          cardId={cardId}
          userId={user.userId}
          lipSync={lipSync}
          emotionGetterRef={chatEmotionGetterRef}
        />
      )}

      {rendererPanelOpen && (
        <SceneRendererPanel
          settings={settings}
          onSet={setSettings}
          onReset={resetSettings}
        />
      )}

      <div className={styles.sceneToolbar}>
        {/* Brain / AI settings */}
        <button
          type="button"
          className={styles.sceneToolbarBtn}
          aria-label={t('toolbar.brain')}
          onClick={() => onOpenSettings?.()}
        >
          <img src="/icons/brain-menu.svg" className={styles.sceneToolbarIcon} alt="" aria-hidden />
        </button>

        {/* Renderer settings toggle */}
        <button
          type="button"
          className={`${styles.sceneToolbarBtn} ${rendererPanelOpen ? styles.sceneToolbarBtnActive : ''}`}
          aria-label="Настройки рендера"
          aria-pressed={rendererPanelOpen}
          onClick={() => setRendererPanelOpen(v => !v)}
        >
          <svg className={styles.sceneToolbarIconSvg} viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Toggle model visibility */}
        <button
          type="button"
          className={`${styles.sceneToolbarBtn} ${styles.sceneToolbarBtnProfile}`}
          aria-label={t('toolbar.toggleModel')}
          aria-pressed={!modelVisible}
          onClick={() => setModelVisible(v => !v)}
        >
          <svg className={styles.sceneToolbarIconSvg} viewBox="0 0 18 18" fill="none" aria-hidden>
            <circle cx="9" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M4 15c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

      </div>
    </div>
  )
}

export default SceneFullscreen
