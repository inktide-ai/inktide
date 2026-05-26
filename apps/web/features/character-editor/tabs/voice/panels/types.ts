import type { AiCharacter } from '@/shared/lib/character'

export interface PanelProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}
