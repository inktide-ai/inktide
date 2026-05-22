'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { AiCharacter } from '@/lib/character/types'
import type { AiCardListItem, LlmModelResponse } from '../../api/soul'
import type { ICardRepository } from '@/types/ICardRepository'
import { apiResponseToCharacter, characterToUpdateRequest, characterToCreateRequest } from '@/lib/character/mappers'

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
  const [saveError, setSaveError] = useState<string | null>(null)
  // Tracks the transient 'saved' window (2s) that TanStack status doesn't provide natively
  const [savedFlag, setSavedFlag] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveMutation = useMutation({
    mutationFn: ({ id, char }: { id: string; char: AiCharacter }) =>
      repo.updateCard(id, characterToUpdateRequest(char)),
  })

  const createMutation = useMutation({
    mutationFn: (req: Parameters<ICardRepository['createCard']>[0]) => repo.createCard(req),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => repo.deleteCard(id),
  })

  // Derive domain SaveStatus from mutation states
  const saveStatus: SaveStatus =
    saveMutation.isPending || createMutation.isPending ? 'saving' :
    saveMutation.isError   || createMutation.isError   ? 'error'  :
    savedFlag ? 'saved' :
    'idle'

  // Clear savedFlag when a new save starts
  useEffect(() => {
    if (saveMutation.isPending) {
      setSavedFlag(false)
      if (savedTimerRef.current) { clearTimeout(savedTimerRef.current); savedTimerRef.current = null }
    }
  }, [saveMutation.isPending])

  const handleSave = useCallback(async (idOverride?: string, charOverride?: AiCharacter) => {
    const id   = idOverride   ?? selectedId
    const char = charOverride ?? selected
    if (!id || !char) return
    setSaveError(null)
    try {
      const response = await saveMutation.mutateAsync({ id, char })
      const updated = apiResponseToCharacter(response)
      onCharacterSaved(id, updated)
      onSnapshotUpdate(updated)
      onListItemUpdate(id, {
        name: updated.name,
        slug: updated.slug,
        personality: updated.personality,
        is_active: updated.isActive,
      })
      setSavedFlag(true)
      savedTimerRef.current = setTimeout(() => { setSavedFlag(false); saveMutation.reset() }, 2000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    }
  }, [selectedId, selected, saveMutation, onCharacterSaved, onSnapshotUpdate, onListItemUpdate])

  const addCharacter = useCallback(async (c: Omit<AiCharacter, 'id'>): Promise<string | null> => {
    const defaultLlm = (
      llmModels.find(m => m.provider === c.llm.providerId)?.id ??
      llmModels[0]?.id
    )
    if (!defaultLlm) {
      setSaveError('No LLM models available. Please seed the catalog first.')
      return null
    }
    setSaveError(null)
    try {
      const response = await createMutation.mutateAsync(characterToCreateRequest(c, defaultLlm))
      const char = apiResponseToCharacter(response)
      const listItem: AiCardListItem = {
        id: char.id,
        name: char.name,
        slug: char.slug,
        avatar_url: null,
        personality: char.personality,
        llm_model: null,
        description: char.description,
        status: char.status,
        cover_url: char.coverUrl,
        platforms: [],
        is_active: char.isActive,
        updated_at: new Date().toISOString(),
        sort_key: char.id,
      }
      onCharacterCreated(char, listItem)
      onSnapshotUpdate(char)
      return char.id
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Create failed')
      return null
    }
  }, [llmModels, createMutation, onCharacterCreated, onSnapshotUpdate])

  const removeCharacter = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      onCharacterDeleted(id)
      setSaveError(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Delete failed')
    }
  }, [deleteMutation, onCharacterDeleted])

  const resetStatus = useCallback(() => {
    setSaveError(null)
    setSavedFlag(false)
    saveMutation.reset()
  }, [saveMutation])

  return { saveStatus, saveError, handleSave, addCharacter, removeCharacter, resetStatus }
}
