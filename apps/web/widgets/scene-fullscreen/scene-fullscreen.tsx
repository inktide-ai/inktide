'use client'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Settings2, User, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvatarRenderer } from '@/features/avatar'
import { useCardModel, useCardScene, useCardChannelId } from '@/entities/soul/hooks'
import { useAudioStream } from '@/shared/hooks/useAudioStream'
import { useLipSync } from '@/shared/hooks/useLipSync'
import { useSceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'
import { useEmotionOverride } from '@/shared/hooks/useEmotionOverride'
import { useAuth } from '@/shared/services/auth'
import type { AiCharacter, ModelType } from '@/shared/lib/character'
import { inferModelType } from '@/shared/lib/utils/model-type'
import SceneRendererPanel from '@/features/character-editor/tabs/scene-renderer-panel'
import { EmotionPanel } from '@/features/character-editor/tabs/emotion-panel'
import SceneChat from '@/features/character-editor/tabs/scene-chat'
import { ChatButton } from '@/features/character-editor/tabs/chat-button'
import { ChatModeMenu, type ChatMode } from '@/features/character-editor/tabs/chat-mode-menu'

interface SceneFullscreenProps {
  character: AiCharacter
  cardId: string
  projectId?: string
  showToolbar?: boolean
  showChat?: boolean
  overrideModelUrl?: string | null
  overrideSceneUrl?: string | null
  onFirstRender?: (canvas: HTMLCanvasElement) => void
}


const SceneFullscreen = ({ character, cardId, projectId, showToolbar = true, showChat = true, overrideModelUrl, overrideSceneUrl, onFirstRender }: SceneFullscreenProps) => {
  const { t } = useTranslation('scene')
  const { user } = useAuth()
  const [modelVisible, setModelVisible] = useState(true)
  const [rendererPanelOpen, setRendererPanelOpen] = useState(false)
  const [emotionPanelOpen, setEmotionPanelOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>('floating')
  const [modeMenuOpen, setModeMenuOpen] = useState(false)

  const { model, loading, error } = useCardModel(overrideModelUrl != null ? undefined : cardId)
  const { scene } = useCardScene(overrideSceneUrl != null ? undefined : cardId)
  const channelId = useCardChannelId(cardId)
  const lipSync = useLipSync()
  const { settings, setSettings, resetSettings } = useSceneRendererSettings(projectId ?? '')

  const { getEmotionState: getAutoEmotionState, getSoulState } = useAudioStream(channelId, { lipSync })
  const { activeEmotion, triggerEmotion, clearEmotion, getEmotionState } = useEmotionOverride(getAutoEmotionState)

  const effectiveModelUrl = overrideModelUrl ?? model?.public_url ?? null
  const effectiveModelType = overrideModelUrl
    ? (overrideModelUrl.endsWith('.vrm') ? 'vrm' : 'glb') as ModelType
    : model
      ? inferModelType(model.original_file_name, model.content_type)
      : character.appearance.modelType

  const background = overrideSceneUrl ?? scene?.public_url ?? 'transparent'

  const toolbarBtnBase = 'w-8 h-8 rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.55)] backdrop-blur-md text-white/60 cursor-pointer flex items-center justify-center p-0 transition-all duration-150 hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.22)] hover:text-white/90 active:scale-[0.95]'

  const avatarUrl = character.appearance.avatarUrl ?? null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: 'transparent', display: 'flex' }}>
      {/* Scene area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
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
              getSoulState={getSoulState}
              baselineMood={character.personalityConfig?.baselineMood ?? 'neutral'}
              onFirstRender={onFirstRender}
            />
          </div>
        )}

        {rendererPanelOpen && (
          <SceneRendererPanel settings={settings} onSet={setSettings} onReset={resetSettings} />
        )}

        <AnimatePresence>
          {emotionPanelOpen && (
            <EmotionPanel
              activeEmotion={activeEmotion}
              onTrigger={triggerEmotion}
              onClear={clearEmotion}
            />
          )}
        </AnimatePresence>

        {/* Fullscreen chat mode — overlays the scene */}
        <AnimatePresence>
          {showChat && user && chatOpen && chatMode === 'fullscreen' && (
            <div className="absolute inset-0 z-20">
              <SceneChat
                cardId={cardId}
                userId={user.userId}
                lipSync={lipSync}
                mode="fullscreen"
                onClose={() => setChatOpen(false)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Top-right toolbar */}
        {showToolbar ? (
          <div className="absolute top-[14px] right-[14px] flex flex-row items-center gap-1.5 z-10">
            <button
              type="button"
              className={cn(toolbarBtnBase, rendererPanelOpen && 'border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.12)] text-indigo-300 hover:bg-[rgba(99,102,241,0.18)] hover:border-[rgba(99,102,241,0.6)] hover:text-indigo-300')}
              aria-label="Renderer settings"
              aria-pressed={rendererPanelOpen}
              onClick={() => setRendererPanelOpen(v => !v)}
            >
              <Settings2 size={14} />
            </button>
            <button
              type="button"
              className={cn(toolbarBtnBase, emotionPanelOpen && 'border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.12)] text-indigo-300 hover:bg-[rgba(99,102,241,0.18)] hover:border-[rgba(99,102,241,0.6)] hover:text-indigo-300')}
              aria-label="Emotions"
              aria-pressed={emotionPanelOpen}
              onClick={() => setEmotionPanelOpen(v => !v)}
            >
              <Smile size={14} />
            </button>
            <button
              type="button"
              className={cn(toolbarBtnBase, !modelVisible && 'border-[rgba(99,102,241,0.5)] bg-[rgba(99,102,241,0.12)] text-indigo-300 hover:bg-[rgba(99,102,241,0.18)] hover:border-[rgba(99,102,241,0.6)] hover:text-indigo-300')}
              aria-label={t('toolbar.toggleModel')}
              aria-pressed={!modelVisible}
              onClick={() => setModelVisible(v => !v)}
            >
              <User size={14} />
            </button>
          </div>
        ) : null}

        {/* Bottom-right: chat button + floating panel + mode menu */}
        {showChat && user && (
          <div
            style={{
              position: 'absolute',
              bottom: 15,
              right: 15,
              zIndex: 10,
              display: 'flex',
              alignItems: 'flex-end',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {/* Floating chat panel — renders above the button */}
            <AnimatePresence>
              {chatOpen && chatMode === 'floating' && (
                <div style={{ marginBottom: 8 }}>
                  <SceneChat
                    cardId={cardId}
                    userId={user.userId}
                    lipSync={lipSync}
                    mode="floating"
                    onClose={() => setChatOpen(false)}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Button area: mode menu + avatar button */}
            <div style={{ position: 'relative' }}>
              <ChatModeMenu
                open={modeMenuOpen}
                mode={chatMode}
                onSelect={(m) => { setChatMode(m); setModeMenuOpen(false) }}
                onClose={() => setModeMenuOpen(false)}
              />
              <ChatButton
                avatarUrl={avatarUrl}
                characterName={character.name}
                isOpen={chatOpen}
                onClick={() => setChatOpen(o => !o)}
                onContextMenu={(e) => { e.preventDefault(); setModeMenuOpen(o => !o) }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sidebar chat mode — docked to the right */}
      <AnimatePresence>
        {showChat && user && chatOpen && chatMode === 'sidebar' && (
          <SceneChat
            cardId={cardId}
            userId={user.userId}
            lipSync={lipSync}
            mode="sidebar"
            onClose={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default SceneFullscreen
