import type { AiCharacter } from '@/shared/lib/character'

export function SoulVoiceCard({ character }: { character: AiCharacter }) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-body font-medium text-[var(--text-heading)]">Voice</p>
        <button type="button" className="text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          Settings →
        </button>
      </div>
      <div className="space-y-2">
        <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-2">
          <p className="text-2xs text-[var(--text-tertiary)]">Voice Model</p>
          <p className="text-body font-medium text-[var(--text-primary)]">{character.tts.voiceId ?? 'Garry Voice v2'}</p>
        </div>
        <div className="flex h-[60px] items-center gap-0.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5">
          {Array.from({ length: 28 }, (_, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-[var(--accent-violet-bg)]"
              style={{ height: `${8 + Math.round(Math.sin(i * 0.8) * 12 + Math.cos(i * 1.3) * 8 + 20)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
