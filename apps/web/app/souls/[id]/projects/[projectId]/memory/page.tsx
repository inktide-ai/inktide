import { DinoGame } from '@/shared/ui/dino-game'

export default function SoulProjectMemoryPage() {
  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
        <div className="bg-[var(--bg-0)] px-4 pt-6 pb-2">
          <DinoGame />
        </div>

        <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-0)] px-6 py-5">
          <p className="mb-1 text-body font-semibold text-[var(--text-primary)]">Memory в разработке</p>
          <p className="text-body leading-relaxed text-[var(--text-secondary)]">
            Память для проекта запомнит важные моменты и контекст, чтобы общение становилось глубже.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Early access · 2027
          </p>
        </div>
      </div>
    </div>
  )
}
