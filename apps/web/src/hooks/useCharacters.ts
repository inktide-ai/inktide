import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getCards,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  getCatalogLlmModels,
  type AiCardListItem,
  type LlmModelResponse,
} from '../api/soul'
import type { AiCharacter } from '../domain/character'
import {
  apiResponseToCharacter,
  characterToUpdateRequest,
  characterToCreateRequest,
} from '../domain/character'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useCharacters() {
  const [cardList, setCardList] = useState<AiCardListItem[]>([])
  const [characters, setCharacters] = useState<Map<string, AiCharacter>>(new Map())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [llmModels, setLlmModels] = useState<LlmModelResponse[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const snapshotRef = useRef<AiCharacter | null>(null)

  const selected = selectedId ? characters.get(selectedId) ?? null : null

  // ── Load full card data ──
  const loadFullCard = useCallback(async (id: string) => {
    try {
      const response = await getCard(id)
      const char = apiResponseToCharacter(response)
      setCharacters((prev) => new Map(prev).set(id, char))
      snapshotRef.current = char
    } catch {
      /* card might have been deleted */
    }
  }, [])

  // ── Fetch card list + catalog on mount ──
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [cards, models] = await Promise.all([getCards(), getCatalogLlmModels()])
        if (cancelled) return
        setCardList(cards)
        setLlmModels(models)
        setLoading(false)
        if (cards.length > 0) {
          setSelectedId(cards[0].id)
          void loadFullCard(cards[0].id)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load')
          setLoading(false)
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [loadFullCard])

  // ── Select a card (lazy-load full data on first visit) ──
  const selectCard = useCallback(async (id: string) => {
    setSelectedId(id)
    setIsDirty(false)
    setSaveStatus('idle')
    setSaveError(null)
    if (!characters.has(id)) {
      await loadFullCard(id)
    } else {
      snapshotRef.current = characters.get(id)!
    }
  }, [characters, loadFullCard])

  /** Force-reload a card and reset dirty state. Called when returning from CharacterEditPage. */
  const reloadCard = useCallback(async (id: string) => {
    setSelectedId(id)
    setIsDirty(false)
    setSaveStatus('idle')
    setSaveError(null)
    try {
      const response = await getCard(id)
      const char = apiResponseToCharacter(response)
      setCharacters((prev) => new Map(prev).set(id, char))
      snapshotRef.current = char
    } catch {
      /* ignore */
    }
  }, [])

  // ── Patch local state (marks dirty, skips appearance.avatarUrl-only updates) ──
  const updateCharacter = useCallback((id: string, patch: Partial<AiCharacter>) => {
    const newAvatarUrl = patch.appearance?.avatarUrl
    const avatarOnly =
      Object.keys(patch).length === 1 &&
      Object.prototype.hasOwnProperty.call(patch, 'appearance') &&
      Object.keys(patch.appearance!).length === 1 &&
      Object.prototype.hasOwnProperty.call(patch.appearance, 'avatarUrl')

    setCharacters((prev) => {
      const existing = prev.get(id)
      if (!existing) return prev
      const merged = { ...existing, ...patch }
      const next = new Map(prev)
      next.set(id, merged)
      if (newAvatarUrl !== undefined) snapshotRef.current = merged
      return next
    })

    if (newAvatarUrl !== undefined) {
      setCardList((prev) =>
        prev.map((c) => (c.id === id ? { ...c, avatar_url: newAvatarUrl ?? null } : c)),
      )
    }

    if (!avatarOnly) {
      setIsDirty(true)
      setSaveStatus('idle')
    }
  }, [])

  // ── Discard — restore from last saved snapshot ──
  const discardChanges = useCallback(() => {
    if (selectedId && snapshotRef.current) {
      setCharacters((prev) => new Map(prev).set(selectedId, snapshotRef.current!))
    }
    setIsDirty(false)
    setSaveStatus('idle')
    setSaveError(null)
  }, [selectedId])

  // ── Save to backend ──
  const handleSave = useCallback(async () => {
    if (!selectedId || !selected) return
    setSaveStatus('saving')
    setSaveError(null)
    try {
      const response = await updateCard(selectedId, characterToUpdateRequest(selected))
      const updated = apiResponseToCharacter(response)
      setCharacters((prev) => new Map(prev).set(selectedId, updated))
      snapshotRef.current = updated
      setIsDirty(false)
      setSaveStatus('saved')
      setCardList((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, name: updated.name, slug: updated.slug, personality: updated.personality, is_active: updated.isActive }
            : c,
        ),
      )
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    }
  }, [selectedId, selected])

  // ── Create a new character ──
  const addCharacter = useCallback(async (c: Omit<AiCharacter, 'id'>) => {
    const defaultLlm = llmModels[0]?.id
    if (!defaultLlm) {
      setSaveError('No LLM models available. Please seed the catalog first.')
      setSaveStatus('error')
      return
    }
    setSaveStatus('saving')
    try {
      const response = await createCard(characterToCreateRequest(c, defaultLlm))
      const char = apiResponseToCharacter(response)
      setCharacters((prev) => new Map(prev).set(char.id, char))
      setCardList((prev) => [
        ...prev,
        {
          id: char.id,
          name: char.name,
          slug: char.slug,
          avatar_url: null,
          personality: char.personality,
          llm_model: null,
          is_active: char.isActive,
          updated_at: new Date().toISOString(),
        },
      ])
      snapshotRef.current = char
      setSelectedId(char.id)
      setIsDirty(false)
      setSaveStatus('idle')
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Create failed')
    }
  }, [llmModels])

  // ── Delete a character ──
  const removeCharacter = useCallback(async (id: string) => {
    try {
      await deleteCard(id)
      setCardList((prev) => prev.filter((c) => c.id !== id))
      setCharacters((prev) => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
      setSelectedId((sid) => {
        if (sid !== id) return sid
        const remaining = cardList.filter((c) => c.id !== id)
        return remaining[0]?.id ?? null
      })
      setIsDirty(false)
      setSaveStatus('idle')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Delete failed')
      setSaveStatus('error')
    }
  }, [cardList])

  return {
    cardList,
    characters,
    selectedId,
    selected,
    loading,
    loadError,
    llmModels,
    isDirty,
    saveStatus,
    saveError,
    selectCard,
    reloadCard,
    updateCharacter,
    discardChanges,
    handleSave,
    addCharacter,
    removeCharacter,
  }
}
