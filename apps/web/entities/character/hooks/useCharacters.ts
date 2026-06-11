'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import equal from 'fast-deep-equal'
import type { AiCharacter } from '@/shared/lib/character/types'
import { SoulCardRepository } from '@/entities/soul/services/cards/SoulCardRepository'
import { useCharacterList } from './characters/useCharacterList'
import { useSelectedCharacter } from './characters/useSelectedCharacter'
import { useDirtyState } from './characters/useDirtyState'
import { useCharacterMutations } from './characters/useCharacterMutations'

export type { SaveStatus } from './characters/useCharacterMutations'

/**
 * Фасад (backward compat): составляет четыре фокусных хука в единый контракт,
 * который ожидает CharactersContext. Внешний API не изменился.
 *
 * DIP: зависит от SoulCardRepository через ICardRepository интерфейс.
 * OCP-тест: заменить REST→GraphQL = только поменять `new SoulCardRepository()`
 *           ни один из четырёх суб-хуков не трогается.
 */
export function useCharacters() {
  // DI через singleton ref — позволяет тестировать, подменяя реализацию
  const repoRef = useRef(new SoulCardRepository())
  const repo = repoRef.current

  // Auto-save debounce (Figma-style: save 600ms after last change)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Stable ref to handleSave to avoid circular dep in updateCharacter
  const handleSaveRef = useRef<(id?: string, char?: AiCharacter) => Promise<void>>(() => Promise.resolve())
  // Always-current map of characters — read at timer fire time for entity-bound save
  const charactersRef = useRef<Map<string, AiCharacter>>(new Map())


  const {
    cardList,
    llmModels,
    loading,
    loadError,
    updateListItem,
    addListItem,
    removeListItem,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCharacterList(repo)

  const {
    characters,
    selectedId,
    setSelectedId,
    selected,
    cardLoadError,
    selectCard: selectCardInternal,
    reloadCard: reloadCardInternal,
    setCharacter,
    patchCharacter,
    removeCharacterById,
  } = useSelectedCharacter(repo)

  const { isDirty, recordSnapshot, markDirty, clearDirty, getSnapshot } = useDirtyState()

  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])
  useEffect(() => () => { if (autoSaveTimerRef.current !== null) clearTimeout(autoSaveTimerRef.current) }, [])

  // Plugin registry for side-effect saves (e.g. BYOK credentials from BrainTab)
  const savePluginsRef = useRef(new Map<string, () => Promise<void>>())
  const [externalDirty, setExternalDirty] = useState(false)

  const registerSavePlugin = useCallback((key: string, fn: () => Promise<void>) => {
    savePluginsRef.current.set(key, fn)
  }, [])

  const unregisterSavePlugin = useCallback((key: string) => {
    savePluginsRef.current.delete(key)
  }, [])

  const markCredentialDirty = useCallback(() => setExternalDirty(true), [])
  const clearCredentialDirty = useCallback(() => setExternalDirty(false), [])

  const { saveStatus, saveError, handleSave: handleSaveCard, addCharacter, removeCharacter, reportPluginError } = useCharacterMutations({
    repo,
    llmModels,
    selectedId,
    selected,
    onCharacterSaved: (id, char) => setCharacter(id, char),
    onCharacterCreated: (char, listItem) => {
      setCharacter(char.id, char)
      addListItem(listItem)
      setSelectedId(char.id)
    },
    onCharacterDeleted: (id) => {
      removeListItem(id)
      removeCharacterById(id)
      setSelectedId((sid) => {
        if (sid !== id) return sid
        const remaining = cardList.filter((c) => c.id !== id)
        return remaining[0]?.id ?? null
      })
    },
    onSnapshotUpdate: recordSnapshot,
    onListItemUpdate: (id, patch) => updateListItem(id, patch),
  })


  const selectCard = useCallback(async (id: string) => {
    if (autoSaveTimerRef.current !== null) { clearTimeout(autoSaveTimerRef.current); autoSaveTimerRef.current = null }
    clearDirty()
    await selectCardInternal(id, recordSnapshot)
  }, [selectCardInternal, clearDirty, recordSnapshot])

  const reloadCard = useCallback(async (id: string) => {
    clearDirty()
    await reloadCardInternal(id, recordSnapshot)
  }, [reloadCardInternal, clearDirty, recordSnapshot])

  /** Патчит локальное состояние. Avatar-only патч не помечает dirty. */
  const updateCharacter = useCallback((id: string, patch: Partial<AiCharacter>) => {
    const newAvatarUrl = patch.appearance?.avatarUrl
    const avatarOnly =
      Object.keys(patch).length === 1 &&
      Object.prototype.hasOwnProperty.call(patch, 'appearance') &&
      Object.keys(patch.appearance!).length === 1 &&
      Object.prototype.hasOwnProperty.call(patch.appearance, 'avatarUrl')

    const current = characters.get(id)  // pre-patch; patchCharacter queues setState, does not mutate Map
    patchCharacter(id, patch)

    if (newAvatarUrl !== undefined) {
      updateListItem(id, { avatar_url: newAvatarUrl ?? null })
      if (current) {
        const merged = { ...current, ...patch }
        // Sync TQ detail cache so avatarUrl survives CharactersProvider remount
        setCharacter(id, merged)
        recordSnapshot(merged)
      }
    }

    if (!avatarOnly) {
      const next = current ? { ...current, ...patch } : null
      const snapshot = getSnapshot()
      const actuallyDirty = next === null || snapshot === null || !equal(next, snapshot)

      if (actuallyDirty) {
        markDirty()
        // Auto-save: debounce so rapid edits (typing) collapse into one API call.
        // Capture id at creation time; read latest char state at fire time — decouples save from selectedId.
        if (autoSaveTimerRef.current !== null) clearTimeout(autoSaveTimerRef.current)
        const capturedId = id
        autoSaveTimerRef.current = setTimeout(() => {
          const latestChar = charactersRef.current.get(capturedId)
          if (latestChar) void handleSaveRef.current(capturedId, latestChar)
        }, 600)
      } else {
        clearDirty()
        if (autoSaveTimerRef.current !== null) {
          clearTimeout(autoSaveTimerRef.current)
          autoSaveTimerRef.current = null
        }
      }
    }
  }, [characters, patchCharacter, updateListItem, recordSnapshot, markDirty, getSnapshot, clearDirty])

  const handleSave = useCallback(async () => {
    await handleSaveCard()
    // Snapshot entries so (a) new registrations mid-save are excluded,
    // (b) already-unregistered plugins are skipped before execution starts.
    // Note: filter runs before allSettled — it cannot cancel fns already mid-await.
    // mountedRef guards the setState calls after allSettled completes.
    const snapshot = [...savePluginsRef.current.entries()]
    const results = await Promise.allSettled(
      snapshot
        .filter(([key]) => savePluginsRef.current.has(key))
        .map(([, fn]) => fn()),
    )
    if (!mountedRef.current) return
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (failed.length > 0) {
      const msg = failed.map((r) => (r.reason as Error)?.message ?? 'Credential save failed').join('; ')
      reportPluginError(msg)
      return
    }
    clearCredentialDirty()
  }, [handleSaveCard, clearCredentialDirty, reportPluginError])

  // Keep refs in sync
  useEffect(() => { handleSaveRef.current = handleSaveCard }, [handleSaveCard])
  useEffect(() => { charactersRef.current = characters }, [characters])

  const discardChanges = useCallback(() => {
    if (autoSaveTimerRef.current !== null) { clearTimeout(autoSaveTimerRef.current); autoSaveTimerRef.current = null }
    const snapshot = getSnapshot()
    if (selectedId && snapshot) {
      setCharacter(selectedId, snapshot)
    }
    clearDirty()
    clearCredentialDirty()
  }, [selectedId, getSnapshot, setCharacter, clearDirty, clearCredentialDirty])

  // Auto-select первой карточки после первоначальной загрузки
  const didAutoSelect = useRef(false)
  useEffect(() => {
    if (!loading && !didAutoSelect.current && cardList.length > 0 && selectedId === null) {
      didAutoSelect.current = true
      void selectCard(cardList[0].id)
    }
  }, [loading, cardList, selectedId, selectCard])

  return {
    // list
    cardList,
    llmModels,
    loading,
    loadError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // selection
    characters,
    selectedId,
    selected,
    cardLoadError,
    // dirty
    isDirty: isDirty || externalDirty,
    // save
    saveStatus,
    saveError,
    // methods
    selectCard,
    reloadCard,
    updateCharacter,
    discardChanges,
    handleSave,
    addCharacter,
    removeCharacter,
    registerSavePlugin,
    unregisterSavePlugin,
    markCredentialDirty,
    clearSelection: () => setSelectedId(null),
  }
}
