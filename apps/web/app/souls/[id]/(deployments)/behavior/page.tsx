'use client'

import BehaviorTab from '@/components/profile/tabs/behavior-tab'
import { useCharactersContext } from '@/context/CharactersContext'

export default function SoulBehaviorPage() {
  const { selected, updateCharacter } = useCharactersContext()
  if (!selected) return null
  return (
    <div className="px-5 py-4 space-y-3">
      <div className="overflow-hidden rounded-lg border border-[var(--border-card)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-divider)]">
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Behavior</p>
            <p className="text-[14px] text-[var(--text-tertiary)] mt-0.5">Configure how your soul responds and interacts.</p>
          </div>
        </div>
        <div className="px-4 py-4">
          <BehaviorTab
            character={selected}
            onUpdate={(patch) => updateCharacter(selected.id, patch)}
          />
        </div>
      </div>
    </div>
  )
}
