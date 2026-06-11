'use client'
import { useCharactersContext } from '@/entities/character'
import { ModelTab } from '@/features/character-editor'

export default function SoulAvatarsPage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <div className="mx-auto w-full max-w-7xl px-24 pb-14 pt-9 xl:max-w-[90rem]">
      <header className="mb-9">
        <h1 className="text-[1.625rem] font-semibold leading-8 text-[var(--text-heading)]">Model</h1>
        <p className="mt-1 text-[1rem] leading-6 text-[var(--text-secondary)]">
          Choose and configure the AI model that represents{' '}
          <span className="font-medium text-[var(--text-primary)]">{selected.name}</span>.
        </p>
      </header>
      <ModelTab
        character={selected}
        onUpdate={(patch) => updateCharacter(selected.id, patch)}
        cardId={selected.id}
      />
    </div>
  )
}
