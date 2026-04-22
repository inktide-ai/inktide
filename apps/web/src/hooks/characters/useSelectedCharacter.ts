import { useCallback, useState } from 'react'
import type { AiCharacter } from '../../domain/character/types'
import type { ICardRepository } from '../../ports/ICardRepository'
import { apiResponseToCharacter } from '../../domain/character/mappers'

/**
 * ISP: единственная ответственность — выбор карточки + lazy-load полных данных.
 * Не знает о списке, грязном состоянии или мутациях.
 */
export function useSelectedCharacter(repo: ICardRepository) {
  const [characters, setCharacters] = useState<Map<string, AiCharacter>>(new Map())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = selectedId ? characters.get(selectedId) ?? null : null

  const loadFullCard = useCallback(async (id: string): Promise<AiCharacter> => {
    const response = await repo.getCard(id)
    const char = apiResponseToCharacter(response)
    setCharacters((prev) => new Map(prev).set(id, char))
    return char
  }, [repo])

  const selectCard = useCallback(async (
    id: string,
    onSnapshotUpdate: (char: AiCharacter) => void,
  ) => {
    setSelectedId(id)
    const existing = characters.get(id)
    if (!existing) {
      try {
        const char = await loadFullCard(id)
        onSnapshotUpdate(char)
      } catch {
        /* card might have been deleted */
      }
    } else {
      onSnapshotUpdate(existing)
    }
  }, [characters, loadFullCard])

  const reloadCard = useCallback(async (
    id: string,
    onSnapshotUpdate: (char: AiCharacter) => void,
  ) => {
    setSelectedId(id)
    try {
      const char = await loadFullCard(id)
      onSnapshotUpdate(char)
    } catch {
      /* ignore */
    }
  }, [loadFullCard])

  const setCharacter = useCallback((id: string, char: AiCharacter) => {
    setCharacters((prev) => new Map(prev).set(id, char))
  }, [])

  const patchCharacter = useCallback((id: string, patch: Partial<AiCharacter>) => {
    setCharacters((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      return new Map(prev).set(id, { ...existing, ...patch })
    })
  }, [])

  const removeCharacterById = useCallback((id: string) => {
    setCharacters((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    setSelectedId((sid) => (sid === id ? null : sid))
  }, [])

  return {
    characters,
    selectedId,
    setSelectedId,
    selected,
    selectCard,
    reloadCard,
    setCharacter,
    patchCharacter,
    removeCharacterById,
  }
}
