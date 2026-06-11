'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useChatChannel } from '../hooks/useChatChannel'
import { buildChannelId } from '@/shared/lib/channel-id'
import type { LipSyncHandle } from '@/shared/hooks/useLipSync'
import type { EmotionState } from '@/shared/types/IVrmController'
import type { ChatMode } from './chat-mode-menu'

interface SceneChatProps {
  cardId: string
  userId: string
  mode?: ChatMode
  lipSync?: LipSyncHandle
  emotionGetterRef?: React.MutableRefObject<(() => EmotionState) | null>
  onClose?: () => void
}


const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
    <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
  </svg>
)

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
    <line x1="4" y1="8" x2="12" y2="8" />
  </svg>
)

const SendIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1v10M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)


const FLOATING_VARIANTS = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit:    { scale: 0.5, opacity: 0 },
}

const SIDEBAR_VARIANTS = {
  initial: { x: 320, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit:    { x: 320, opacity: 0 },
}

const FULLSCREEN_VARIANTS = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.98 },
}


const SceneChat = ({ cardId, userId, mode = 'floating', lipSync, emotionGetterRef, onClose }: SceneChatProps) => {
  const channelId = buildChannelId(cardId, userId)
  const { t } = useTranslation('scene')

  const { messages, send, retry, getEmotionState } = useChatChannel(channelId, lipSync)

  useEffect(() => {
    if (!emotionGetterRef) return
    emotionGetterRef.current = getEmotionState
    return () => { emotionGetterRef.current = null }
  }, [emotionGetterRef, getEmotionState])

  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  const submit = async () => {
    const text = input.trim()
    if (!text || submitting) return
    setInput('')
    setSubmitting(true)
    try { await send(text) } finally { setSubmitting(false) }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit() }
  }


  const variants =
    mode === 'sidebar'    ? SIDEBAR_VARIANTS :
    mode === 'fullscreen' ? FULLSCREEN_VARIANTS :
    FLOATING_VARIANTS

  const panelStyle: React.CSSProperties =
    mode === 'floating' ? {
      width: 280,
      height: 420,
      transformOrigin: 'right bottom',
      borderRadius: '22px 22px 32px 32px',
      boxShadow: 'var(--menu-panel-shadow)',
      overflow: 'hidden',
    } :
    mode === 'sidebar' ? {
      width: 320,
      height: '100%',
      borderRadius: 0,
      borderLeft: '1px solid var(--border-subtle)',
      overflow: 'hidden',
    } : {
      // fullscreen
      width: '100%',
      height: '100%',
      borderRadius: 0,
      overflow: 'hidden',
    }

  return (
    <motion.div
      className="flex flex-col bg-[var(--bg-0)]"
      style={panelStyle}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-[44px] shrink-0 bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">Chat</span>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--text-tertiary)] shrink-0" aria-hidden>
            <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <div className="flex items-center gap-0.5">
          {/* New chat — placeholder, reloads the channel by clearing input */}
          <button
            type="button"
            aria-label="New chat"
            onClick={() => setInput('')}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors border-none bg-transparent cursor-pointer"
          >
            <PlusIcon />
          </button>
          {/* Minimize / close */}
          {onClose && (
            <button
              type="button"
              aria-label="Hide chat"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors border-none bg-transparent cursor-pointer"
            >
              <MinusIcon />
            </button>
          )}
        </div>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col [scrollbar-width:thin] [scrollbar-color:var(--scrollbar-thumb,rgba(255,255,255,0.06))_transparent]"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center my-auto">
            <p className="m-0 text-body text-[var(--text-disabled)] leading-[1.6]">
              {t('chat.emptyText')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col py-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'px-4 py-[7px] flex flex-col text-body leading-[1.55]',
                  msg.role === 'user' ? 'items-end bg-[var(--surface-1)]' : 'items-start',
                )}
              >
                <span className={cn(
                  'text-2xs font-medium tracking-[0.06em] uppercase mb-[3px]',
                  msg.role === 'user' ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-disabled)]',
                )}>
                  {msg.role === 'user' ? 'You' : 'AI'}
                </span>

                {msg.status === 'failed' ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[var(--danger-text)] break-words max-w-full">{msg.content}</span>
                    <button
                      className="self-start text-xs text-[var(--danger-text)] opacity-60 hover:opacity-100 bg-none border-none p-0 cursor-pointer transition-opacity duration-150"
                      onClick={() => retry(msg.id)}
                      aria-label={t('chat.retry')}
                    >
                      {t('chat.retry')}
                    </button>
                  </div>
                ) : msg.pending && !msg.content ? (
                  <span className="inline-flex gap-[5px] items-center h-[1.2em]" aria-label={t('chat.thinking')}>
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="inline-block w-[4px] h-[4px] rounded-full bg-[var(--text-tertiary)] animate-[dotBounce_1.2s_ease-in-out_infinite]"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                ) : (
                  <span className={cn(
                    'break-words max-w-full',
                    msg.role === 'user' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
                  )}>
                    {msg.content}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex items-center border-t border-[var(--border-subtle)] px-3 h-[46px] shrink-0 gap-2">
        <button
          type="button"
          className="shrink-0 w-[20px] flex items-center justify-center bg-transparent border-none cursor-pointer p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => void submit()}
          disabled={submitting || !input.trim()}
          aria-label="Send"
        >
          <SendIcon />
        </button>
        <input
          className="flex-1 bg-transparent border-none outline-none text-body text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] caret-[var(--text-primary)] min-w-0 font-[inherit] py-0"
          type="text"
          placeholder={t('chat.inputPlaceholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </motion.div>
  )
}

export default SceneChat
