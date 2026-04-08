import { useEffect, useRef, useState } from 'react'
import logoSvg from '../../../assets/icon.svg'
import caretSvg from '../../../assets/icons/caret-down.svg'
import { useChatChannel } from '../../../hooks/useChatChannel'
import type { LipSyncHandle } from '../../../hooks/useLipSync'
import styles from './SceneChat.module.css'

interface SceneChatProps {
  cardId: string
  userId: string
  lipSync?: LipSyncHandle
}

const SceneChat = ({ cardId, userId, lipSync }: SceneChatProps) => {
  // One composite channelId per (card, user) pair — SaaS isolation guarantee.
  const channelId = `${cardId}:${userId}`

  const { messages, send, retry } = useChatChannel(channelId, lipSync)
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom whenever message list grows.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const submit = async () => {
    const text = input.trim()
    if (!text || submitting) return
    setInput('')
    setSubmitting(true)
    try {
      await send(text)
    } finally {
      setSubmitting(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <div className={styles.chat}>
      <div className={styles.body} ref={listRef}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <img src={logoSvg} alt="Chimera" className={styles.emptyLogo} />
            <p className={styles.emptyText}>
              Here you can test your character
              <br />
              Enter <span className={styles.emptyCmd}>/test</span> for testing chat
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.role === 'user' ? styles.msgUser : styles.msgAssistant}
            >
              {msg.role === 'assistant' && (
                <img src={logoSvg} alt="" className={styles.msgAvatar} aria-hidden />
              )}
              <div className={msg.status === 'failed' ? styles.msgBubbleFailed : styles.msgBubble}>
                {msg.pending && !msg.content ? (
                  <span className={styles.typingDots} aria-label="Thinking">
                    <span /><span /><span />
                  </span>
                ) : (
                  msg.content
                )}
                {msg.status === 'failed' && (
                  <button
                    className={styles.retryBtn}
                    onClick={() => retry(msg.id)}
                    aria-label="Retry"
                  >
                    ↺ Retry
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.inputBar}>
        <button
          type="button"
          className={styles.sendBtn}
          onClick={() => void submit()}
          disabled={submitting || !input.trim()}
          aria-label="Send"
        >
          <img src={caretSvg} alt="" className={styles.sendIcon} aria-hidden />
        </button>
        <input
          className={styles.input}
          type="text"
          placeholder="Enter somewhere"
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
