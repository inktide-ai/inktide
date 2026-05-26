'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageSquare, Settings2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import AvatarRenderer from '@/features/avatar/avatar-renderer'
import { useCardModel } from '@/features/avatar/hooks/use-card-model'
import { useCardScene } from '@/features/avatar/hooks/use-card-scene'
import { useAudioStream } from '@/shared/hooks/useAudioStream'
import { useCardChannelId } from '../../../hooks/useCardChannelId'
import { useLipSync } from '@/shared/hooks/useLipSync'
import { useSceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'
import { useAuth } from '@/context/AuthContext'
import type { AiCharacter, ModelType } from '@/shared/lib/character'
import { inferModelType } from '@/lib/utils/model-type'
import SceneRendererPanel from './scene-renderer-panel'
import SceneChat from './scene-chat'

interface SceneFullscreenProps {
  character: AiCharacter
  cardId: string
  onOpenSettings?: () => void
  showToolbar?: boolean
  showChat?: boolean
  overrideModelUrl?: string | null
  overrideSceneUrl?: string | null
}


const SceneFullscreen = ({ character, cardId, showToolbar = true, showChat = true, overrideModelUrl, overrideSceneUrl }: SceneFullscreenProps) => {
  const { t } = useTranslation('scene')
  const { user } = useAuth()
  const [modelVisible, setModelVisible] = useState(true)
  const [rendererPanelOpen, setRendererPanelOpen] = useState(false)
  const [chatVisible, setChatVisible] = useState(true)
  const { model, loading, error } = useCardModel(overrideModelUrl != null ? undefined : cardId)
  const { scene } = useCardScene(overrideSceneUrl != null ? undefined : cardId)
  const channelId = useCardChannelId(cardId)
  const lipSync = useLipSync()
  const { settings, setSettings, resetSettings } = useSceneRendererSettings(cardId)

  const { getEmotionState } = useAudioStream(channelId, { lipSync })

  const effectiveModelUrl = overrideModelUrl ?? model?.public_url ?? null
  const effectiveModelType = overrideModelUrl
    ? (overrideModelUrl.endsWith('.vrm') ? 'vrm' : 'glb') as ModelType
    : model
      ? inferModelType(model.original_file_name, model.content_type)
      : character.appearance.modelType

  const background = overrideSceneUrl ?? scene?.public_url ?? 'transparent'

  const toolbarBtnBase = 'w-8 h-8 rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.55)] backdrop-blur-md text-white/60 cursor-pointer flex items-center justify-center p-0 transition-all duration-150 hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.22)] hover:text-white/90 active:scale-[0.95]'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'transparent' }}>
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(44,44,42,1) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 68% 58% at 50% 50%, transparent 15%, black 65%)',
          WebkitMaskImage: 'radial-gradient(ellipse 68% 58% at 50% 50%, transparent 15%, black 65%)',
        }}
      />
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.77rem', zIndex: 2 }}>
          {t('loading')}
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-text)', fontSize: '0.77rem', zIndex: 2 }}>
          {error}
        </div>
      )}
      {!loading && !error && (
        <div className="absolute inset-0 z-0">
          <AvatarRenderer
            modelType={effectiveModelType}
            modelUrl={effectiveModelUrl}
            background={background}
            getMouthWeights={lipSync.getMouthWeights}
            modelVisible={modelVisible}
            rendererSettings={settings}
            getEmotionState={getEmotionState}
            baselineMood={character.personalityConfig.baselineMood}
          />
        </div>
      )}

      {rendererPanelOpen && (
        <SceneRendererPanel settings={settings} onSet={setSettings} onReset={resetSettings} />
      )}

      {showChat && user && (
        <SceneChat cardId={cardId} userId={user.userId} lipSync={lipSync} hidden={!chatVisible} />
      )}

      {showToolbar ? (
        <div className="absolute top-[14px] right-[14px] flex flex-row items-center gap-1.5 z-10">
          <button
            type="button"
            className={cn(toolbarBtnBase, rendererPanelOpen && 'border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.12)] text-[#a5b4fc] hover:bg-[rgba(99,102,241,0.18)] hover:border-[rgba(99,102,241,0.6)] hover:text-[#a5b4fc]')}
            aria-label="Renderer settings"
            aria-pressed={rendererPanelOpen}
            onClick={() => setRendererPanelOpen(v => !v)}
          >
            <Settings2 size={14} />
          </button>
          <button
            type="button"
            className={cn(toolbarBtnBase, !modelVisible && 'border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.12)] text-[#a5b4fc] hover:bg-[rgba(99,102,241,0.18)] hover:border-[rgba(99,102,241,0.6)] hover:text-[#a5b4fc]')}
            aria-label={t('toolbar.toggleModel')}
            aria-pressed={!modelVisible}
            onClick={() => setModelVisible(v => !v)}
          >
            <User size={14} />
          </button>
          {showChat && (
            <button
              type="button"
              className={cn(toolbarBtnBase, chatVisible && 'border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.12)] text-[#a5b4fc] hover:bg-[rgba(99,102,241,0.18)] hover:border-[rgba(99,102,241,0.6)] hover:text-[#a5b4fc]')}
              aria-label="Toggle chat"
              aria-pressed={chatVisible}
              onClick={() => setChatVisible(v => !v)}
            >
              <MessageSquare size={14} />
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default SceneFullscreen
