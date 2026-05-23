'use client'

import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { MoreHorizontal, Pencil, Share2 } from 'lucide-react'
import type { AiCharacter } from '@/lib/character'
import { uploadCardAvatar } from '@/api/soul'
import { useCharactersContext } from '@/context/CharactersContext'

interface SoulCharacterCardProps {
  character: AiCharacter
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] px-2 py-0.5 text-[14px] text-[var(--text-secondary)]">
      {label}
    </span>
  )
}

export function SoulCharacterCard({ character }: SoulCharacterCardProps) {
  const { updateCharacter } = useCharactersContext()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [nameDraft, setNameDraft] = useState(character.name)
  const [personalityDraft, setPersonalityDraft] = useState(character.personality)
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    void navigator.clipboard.writeText(`${window.location.origin}/p/${character.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modelName = useMemo(
    () => character.llm.modelId ?? 'Claude 3.5 Sonnet',
    [character.llm.modelId],
  )

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
              <p className="text-[var(--text-primary)]">Jan 15, 2024</p>
            </div>
            <div>
              <p className="mb-1 text-[12px] text-[var(--text-secondary)]">Status</p>
              <div className="flex items-center gap-1.5 text-[var(--success-text)]">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--success-text)]" />
                Active
              </div>
            </div>
            <div>
              <p className="mb-1 text-[12px] text-[var(--text-secondary)]">Model</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-primary)]">{modelName}</span>
                <button type="button" className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]">
                  <Pencil size={11} />
                </button>
              </div>
            </div>
            <div>
              <p className="mb-1 text-[12px] text-[var(--text-secondary)]">Type</p>
              <div className="flex items-center gap-3">
                <p className="text-[var(--text-primary)]">Detective AI</p>
                <span className="rounded bg-[var(--accent-violet-bg)] px-2 py-0.5 text-[12px] font-medium text-[var(--accent-violet-text)]">AI</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="mb-1.5 text-[12px] text-[var(--text-secondary)]">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              <Tag label="Core" />
              <Tag label="Detective" />
              <Tag label="Sarcastic" />
              <Tag label="Rebel" />
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
