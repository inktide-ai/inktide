'use client'

import { motion } from 'framer-motion'

interface ChatButtonProps {
  avatarUrl: string | null
  characterName?: string | null
  isOpen: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function ChatButton({ avatarUrl, characterName, isOpen, onClick, onContextMenu }: ChatButtonProps) {
  const initial = characterName?.replace(/^\./, '').charAt(0).toUpperCase() ?? '✦'

  return (
    <motion.button
      type="button"
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      onClick={onClick}
      onContextMenu={onContextMenu}
      animate={{ scale: isOpen ? 0.92 : 1 }}
      whileHover={{ scale: isOpen ? 0.96 : 1.08 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        padding: 0,
        border: 'none',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--menu-panel-shadow)',
        background: 'var(--accent-primary)',
        transition: 'box-shadow 0.2s',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={characterName ?? 'character'}
          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%', userSelect: 'none' }}
          draggable={false}
        />
      ) : (
        <span style={{ fontSize: 16, fontWeight: 700, color: 'white', lineHeight: 1 }}>
          {initial}
        </span>
      )}
    </motion.button>
  )
}
