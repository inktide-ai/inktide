'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useChatChannel } from '../../../hooks/useChatChannel'
import type { LipSyncHandle } from '../../../hooks/useLipSync'
import type { EmotionState } from '@/types/IVrmController'

interface SceneChatProps {
  cardId: string
  userId: string
  lipSync?: LipSyncHandle
  emotionGetterRef?: React.MutableRefObject<(() => EmotionState) | null>
  hidden?: boolean
}

const SceneChat = ({ cardId, userId, lipSync, emotionGetterRef, hidden }: SceneChatProps) => {
  const channelId = `${cardId}:${userId}`
  const { t } = useTranslation('scene')

  const { messages, send, retry, getEmotionState } = useChatChannel(channelId, lipSync)

  useEffect(() => {
    if (!emotionGetterRef) return
    emotionGetterRef.current = getEmotionState
    return () => { emotionGetterRef.current = null }
  }, [emotionGetterRef, getEmotionState])

  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [size, setSize] = useState({ w: 280, h: 350 })
  const listRef = useRef<HTMLDivElement>(null)
  const resizeCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => { resizeCleanupRef.current?.(); resizeCleanupRef.current = null }
  }, [])

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

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.w
    const startH = size.h
    const onMove = (ev: PointerEvent) => {
      setSize({
        w: Math.max(280, Math.min(700, startW + (startX - ev.clientX))),
        h: Math.max(200, Math.min(900, startH + (startY - ev.clientY))),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      resizeCleanupRef.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    resizeCleanupRef.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }

  return (
    <div
      className={cn(
        'absolute bottom-[15px] right-[15px] flex flex-col',
        'bg-[var(--bg-0)] border border-[var(--border-subtle)] rounded-[8px] overflow-hidden z-10',
        'transition-[opacity,transform] duration-[500ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
        hidden && 'opacity-0 pointer-events-none translate-x-[110%]',
      )}
      style={{ width: size.w, height: size.h }}
    >
      {/* Resize grip — top-left corner */}
      <div
        className="absolute top-0 left-0 w-5 h-5 cursor-nw-resize z-20 flex items-center justify-center select-none touch-none"
        onPointerDown={startResize}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-white/20">
          <circle cx="1" cy="1" r="1" /><circle cx="4" cy="1" r="1" />
          <circle cx="1" cy="4" r="1" /><circle cx="4" cy="4" r="1" />
        </svg>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[38px] shrink-0 bg-[var(--surface-card)] border-b border-[var(--border-subtle)]">
        <span className="text-[12px] font-medium tracking-[0.08em] uppercase text-[var(--text-tertiary)]">
          Chat
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-[6px] h-[6px] rounded-full bg-[var(--border-default)]" />
        </div>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col [scrollbar-width:thin] [scrollbar-color:var(--scrollbar-thumb,rgba(255,255,255,0.06))_transparent]"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center my-auto">
            <p className="m-0 text-[14px] text-[var(--text-disabled)] leading-[1.6]">
              {t('chat.emptyText')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col py-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'px-4 py-[7px] flex flex-col text-[14px] leading-[1.55]',
                  msg.role === 'user'
                    ? 'items-end bg-[var(--surface-1)]'
                    : 'items-start',
                )}
              >
                <span className={cn(
                  'text-[10px] font-medium tracking-[0.06em] uppercase mb-[3px]',
                  msg.role === 'user'
                    ? 'text-[var(--text-tertiary)]'
                    : 'text-[var(--text-disabled)]',
                )}>
                  {msg.role === 'user' ? 'You' : 'AI'}
                </span>

                {msg.status === 'failed' ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[var(--danger-text)] break-words max-w-full">{msg.content}</span>
                    <button
                      className="self-start text-[12px] text-[var(--danger-text)] opacity-60 hover:opacity-100 bg-none border-none p-0 cursor-pointer transition-opacity duration-150"
                      onClick={() => retry(msg.id)}
                      aria-label={t('chat.retry')}
                    >
                      ↺ {t('chat.retry')}
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
                    msg.role === 'user'
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)]',
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
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          className="flex-1 bg-transparent border-none outline-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] caret-[var(--text-primary)] min-w-0 font-[inherit] py-0"
          type="text"
          placeholder={t('chat.inputPlaceholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

export default SceneChat
