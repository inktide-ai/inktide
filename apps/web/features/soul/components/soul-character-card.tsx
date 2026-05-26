'use client'

import { useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { MoreHorizontal, Share2, X } from 'lucide-react'
import type { AiCharacter } from '@/lib/character'
import { uploadCardAvatar } from '@/api/soul'
import { useCharactersContext } from '@/context/CharactersContext'

const SOUL_CATEGORIES = [
  'Assistant', 'Character', 'Streamer', 'Companion',
  'Detective', 'Warrior', 'Narrator', 'Guide',
] as const

const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  active:   { dot: 'bg-[var(--success-text)]',  text: 'text-[var(--success-text)]',  label: 'Active'   },
  paused:   { dot: 'bg-amber-400',               text: 'text-amber-400',               label: 'Paused'   },
  archived: { dot: 'bg-[var(--text-tertiary)]',  text: 'text-[var(--text-tertiary)]', label: 'Archived' },
}

interface SoulCharacterCardProps {
  character: AiCharacter
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] px-2 py-0.5 text-[14px] text-[var(--text-secondary)]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        aria-label={`Remove tag ${label}`}
      >
        <X size={11} />
      </button>
    </span>
  )
}

export function SoulCharacterCard({ character }: SoulCharacterCardProps) {
  const { updateCharacter } = useCharactersContext()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [nameDraft, setNameDraft] = useState(character.name)
  const [personalityDraft, setPersonalityDraft] = useState(character.personality)
  const [tagInput, setTagInput] = useState('')
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    void navigator.clipboard.writeText(`${window.location.origin}/p/${character.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modelName = useMemo(
    () => character.llm.modelId ?? 'No model',
    [character.llm.modelId],
  )

  const createdLabel = useMemo(
    () => new Date(character.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    [character.createdAt],
  )

  const statusStyle = STATUS_STYLES[character.status] ?? STATUS_STYLES.active

  const onAvatarFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setAvatarBusy(true)
    try {
      const res = await uploadCardAvatar(character.id, file)
      updateCharacter(character.id, { appearance: { ...character.appearance, avatarUrl: res.avatar_url } })
    } finally {
      setAvatarBusy(false)
    }
  }

  const commitName = () => {
    if (nameDraft.trim() && nameDraft.trim() !== character.name) {
      updateCharacter(character.id, { name: nameDraft.trim() })
    }
  }

  const commitPersonality = () => {
    if (personalityDraft !== character.personality) {
      updateCharacter(character.id, { personality: personalityDraft })
    }
  }

  const handleCategoryChange = (value: string) => {
    updateCharacter(character.id, { category: value || null })
  }

  const addTag = (raw: string) => {
    const tag = raw.trim()
    if (!tag || character.tags.includes(tag)) return
    updateCharacter(character.id, { tags: [...character.tags, tag] })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    updateCharacter(character.id, { tags: character.tags.filter(t => t !== tag) })
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--border-card)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-divider)] px-5 py-3.5">
        <h2 className="text-[14px] font-semibold text-[var(--text-heading)]">Soul Details</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-md border border-[var(--border-default)] px-3 py-1.5 text-[14px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
          >
            <Share2 size={13} />
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            type="button"
            className="grid h-[34px] w-[34px] place-items-center rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6 p-5">
        {/* Avatar */}
        <div className="relative h-[148px] w-[190px] shrink-0 overflow-hidden rounded-md border border-[var(--border-default)]">
          <img
            src={character.appearance.avatarUrl ?? '/avatars/miko.png'}
            alt={character.name}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            className="absolute inset-x-2 bottom-2 h-6 rounded border border-white/[0.12] bg-black/55 text-[12px] text-white transition-colors hover:bg-black/70"
            onClick={() => fileRef.current?.click()}
            disabled={avatarBusy}
          >
            {avatarBusy ? 'Uploading…' : 'Change Avatar'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
        </div>

        {/* Metadata */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Name */}
          <input
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onBlur={commitName}
            className="bg-transparent text-[22px] font-semibold leading-none tracking-[-0.02em] text-[var(--text-heading)] outline-none"
          />

          {/* Metadata grid */}
          <div className="grid grid-cols-4 gap-x-6 text-[14px]">
            <div>
              <p className="mb-1 text-[12px] text-[var(--text-secondary)]">Created</p>
              <p className="text-[var(--text-primary)]">{createdLabel}</p>
            </div>
            <div>
              <p className="mb-1 text-[12px] text-[var(--text-secondary)]">Status</p>
              <div className={`flex items-center gap-1.5 ${statusStyle.text}`}>
                <span className={`inline-block h-2 w-2 rounded-full ${statusStyle.dot}`} />
                {statusStyle.label}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[12px] text-[var(--text-secondary)]">Model</p>
              <span className="text-[var(--text-primary)]">{modelName}</span>
            </div>
            <div>
              <p className="mb-1 text-[12px] text-[var(--text-secondary)]">Type</p>
              <select
                value={character.category ?? ''}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full cursor-pointer bg-transparent text-[14px] text-[var(--text-primary)] outline-none"
              >
                <option value="">— None —</option>
                {SOUL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="mb-1.5 text-[12px] text-[var(--text-secondary)]">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {character.tags.map(tag => (
                <Tag key={tag} label={tag} onRemove={() => removeTag(tag)} />
              ))}
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
                placeholder="Add tag…"
                className="min-w-[80px] bg-transparent text-[14px] text-[var(--text-secondary)] placeholder:text-[var(--text-tertiary)] outline-none"
              />
            </div>
          </div>

          {/* Personality */}
          <div>
            <p className="mb-1.5 text-[12px] text-[var(--text-secondary)]">Personality</p>
            <textarea
              value={personalityDraft}
              onChange={e => setPersonalityDraft(e.target.value)}
              onBlur={commitPersonality}
              rows={2}
              className="w-full resize-none rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-2 text-[14px] leading-relaxed text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--border-default)]"
            />
          </div>
        </div>
      </div>
    </article>
  )
}
