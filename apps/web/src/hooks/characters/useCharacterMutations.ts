import { useCallback, useState } from 'react'
import type { AiCharacter } from '../../domain/character/types'
import type { AiCardListItem, LlmModelResponse } from '../../api/soul'
import type { ICardRepository } from '../../ports/ICardRepository'
import { apiResponseToCharacter, characterToUpdateRequest, characterToCreateRequest } from '../../domain/character/mappers'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface MutationDeps {
  repo: ICardRepository
  llmModels: LlmModelResponse[]
  selectedId: string | null
  selected: AiCharacter | null
  onCharacterSaved: (id: string, char: AiCharacter) => void
  onCharacterCreated: (char: AiCharacter, listItem: AiCardListItem) => void
  onCharacterDeleted: (id: string) => void
  onSnapshotUpdate: (char: AiCharacter) => void
  onListItemUpdate: (id: string, patch: Partial<Pick<AiCardListItem, 'name' | 'slug' | 'personality' | 'is_active'>>) => void
}

/**
 * ISP: единственная ответственность — CRUD-мутации (save, create, delete).
 * Принимает ICardRepository (DIP) — не зависит от конкретного soul.ts.
 * Не знает о dirty-state, snapshot или выборе.
 */
export function useCharacterMutations({
  repo,
  llmModels,
  selectedId,
  selected,
  onCharacterSaved,
  onCharacterCreated,
  onCharacterDeleted,
  onSnapshotUpdate,
  onListItemUpdate,
}: MutationDeps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = useCallback(async () => {
    if (!selectedId || !selected) return
    setSaveStatus('saving')
    setSaveError(null)
    try {
      const response = await repo.updateCard(selectedId, characterToUpdateRequest(selected))
      const updated = apiResponseToCharacter(response)
      onCharacterSaved(selectedId, updated)
      onSnapshotUpdate(updated)
      onListItemUpdate(selectedId, {
        name: updated.name,
        slug: updated.slug,
        personality: updated.personality,
        is_active: updated.isActive,
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    }
  }, [selectedId, selected, repo, onCharacterSaved, onSnapshotUpdate, onListItemUpdate])

  const addCharacter = useCallback(async (c: Omit<AiCharacter, 'id'>) => {
    const defaultLlm = llmModels[0]?.id
    if (!defaultLlm) {
      setSaveError('No LLM models available. Please seed the catalog first.')
      setSaveStatus('error')
      return
    }
    setSaveStatus('saving')
    setSaveError(null)
    try {
      const response = await repo.createCard(characterToCreateRequest(c, defaultLlm))
      const char = apiResponseToCharacter(response)
      const listItem: AiCardListItem = {
        id: char.id,
        name: char.name,
        slug: char.slug,
        avatar_url: null,
        personality: char.personality,
        llm_model: null,
        is_active: char.isActive,
        updated_at: new Date().toISOString(),
      }
      onCharacterCreated(char, listItem)
      onSnapshotUpdate(char)
      setSaveStatus('idle')
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Create failed')
    }
  }, [llmModels, repo, onCharacterCreated, onSnapshotUpdate])

  const removeCharacter = useCallback(async (id: string) => {
    try {
      await repo.deleteCard(id)
      onCharacterDeleted(id)
      setSaveStatus('idle')
      setSaveError(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Delete failed')
      setSaveStatus('error')
    }
  }, [repo, onCharacterDeleted])

  const resetStatus = useCallback(() => {
    setSaveStatus('idle')
    setSaveError(null)
  }, [])

  return { saveStatus, saveError, handleSave, addCharacter, removeCharacter, resetStatus }
}
