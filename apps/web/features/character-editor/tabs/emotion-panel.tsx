'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon, addCollection } from '@iconify/react'
import { cn } from '@/lib/utils'
import { EMOTION_OVERRIDE_DURATION_MS } from '@/shared/hooks/useEmotionOverride'
import fluent from '@iconify-json/fluent-emoji-flat/icons.json'

// Register only the icons used in this component - avoids CDN fetches blocked by CSP
addCollection(fluent as Parameters<typeof addCollection>[0])

// IDs must match DEFAULT_GRAPH_CONFIG node IDs in defaultGraph.ts
const EMOTIONS = [
  { id: 'happy',      icon: 'fluent-emoji-flat:clapping-hands',            label: 'Happy',     key: '1' },
  { id: 'angry',      icon: 'fluent-emoji-flat:angry-face',                label: 'Angry',     key: '2' },
  { id: 'sad',        icon: 'fluent-emoji-flat:crying-face',               label: 'Sad',       key: '3' },
  { id: 'surprised',  icon: 'fluent-emoji-flat:face-with-open-mouth',      label: 'Surprised', key: '4' },
  { id: 'blush',      icon: 'fluent-emoji-flat:smiling-face-with-hearts',  label: 'Blush',     key: '5' },
  { id: 'greeting',   icon: 'fluent-emoji-flat:waving-hand',               label: 'Greeting',  key: '6' },
  { id: 'greeting2',  icon: 'fluent-emoji-flat:raising-hands',             label: 'Greeting 2',key: '7' },
  { id: 'pose',       icon: 'fluent-emoji-flat:person-standing',           label: 'Pose',      key: '8' },
  { id: 'peace_sign', icon: 'fluent-emoji-flat:victory-hand',              label: 'Peace',     key: 'q' },
  { id: 'shoot',      icon: 'fluent-emoji-flat:oncoming-fist',             label: 'Shoot',     key: 'w' },
  { id: 'show_body',  icon: 'fluent-emoji-flat:person-gesturing-ok',       label: 'Show',      key: 'e' },
  { id: 'spin',       icon: 'fluent-emoji-flat:dizzy',                     label: 'Spin',      key: 'r' },
] as const

interface EmotionPanelProps {
  activeEmotion: string | null
  onTrigger: (emotion: string) => void
  onClear: () => void
}

export function EmotionPanel({ activeEmotion, onTrigger, onClear }: EmotionPanelProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!activeEmotion) {
      setProgress(100)
      return
    }
    const t = setTimeout(() => setProgress(0), 16)
    return () => {
      clearTimeout(t)
      setProgress(100)
    }
  }, [activeEmotion])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const emotion = EMOTIONS.find((em) => em.key === e.key)
      if (emotion) onTrigger(emotion.id)
      if (e.key === '0') onClear()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onTrigger, onClear])

  const activeInfo = activeEmotion ? EMOTIONS.find((e) => e.id === activeEmotion) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-[13px] right-[13px] w-[240px] flex flex-col bg-[rgba(9,9,11,0.92)] backdrop-blur-2xl border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden z-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_40px_rgba(0,0,0,0.6)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <span className="text-body font-semibold text-[rgba(255,255,255,0.88)] tracking-[-0.01em]">
          Emotions
        </span>
        {activeInfo && (
          <span className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {activeInfo.label}
          </span>
        )}
      </div>

      {/* Timer progress bar */}
      <div className="relative h-[2px] bg-[rgba(255,255,255,0.04)] shrink-0">
        {activeEmotion && (
          <div
            key={activeEmotion}
            className="absolute inset-y-0 left-0 bg-indigo-400/50"
            style={{
              width: `${progress}%`,
              transition: `width ${EMOTION_OVERRIDE_DURATION_MS}ms linear`,
            }}
          />
        )}
      </div>

      {/* Emotion grid */}
      <div className="grid grid-cols-2 gap-[5px] p-3">
        {EMOTIONS.map(({ id, icon, label, key }) => {
          const isActive = activeEmotion === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTrigger(id)}
              className={cn(
                'relative flex flex-col items-center gap-[6px] rounded-xl border py-3 px-2 cursor-default select-none transition-all duration-150',
                isActive
                  ? 'border-[rgba(99,102,241,0.45)] bg-[rgba(99,102,241,0.12)]'
                  : 'border-[rgba(255,255,255,0.07)] bg-transparent hover:bg-[rgba(255,255,255,0.04)]',
              )}
            >
              <span className="absolute top-[5px] right-[5px] text-[10px] font-medium leading-none text-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.06)] rounded-[4px] px-[5px] py-[3px]">
                {key}
              </span>
              <Icon icon={icon} width={36} height={36} />
              <span className={cn(
                'text-[11px] font-medium leading-none',
                isActive ? 'text-indigo-300' : 'text-[rgba(255,255,255,0.42)]',
              )}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Clear row */}
      <div className="px-3 pb-3 pt-0">
        <button
          type="button"
          onClick={onClear}
          disabled={!activeEmotion}
          className="w-full py-[7px] px-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-transparent text-xs font-medium text-[rgba(255,255,255,0.25)] cursor-default select-none transition-all duration-150 hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(255,255,255,0.45)] disabled:opacity-40"
        >
          Clear · 0
        </button>
      </div>
    </motion.div>
  )
}
