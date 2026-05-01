'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AiCharacter } from '@/lib/character/types'
import { SoulCardRepository } from '../services/cards/SoulCardRepository'
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

  // ── 4 фокусных хука ──────────────────────────────────────────────────────────

  const {
    cardList,
    llmModels,
    loading,
    loadError,
    updateListItem,
    addListItem,
    removeListItem,
  } = useCharacterList(repo)

  const {
    characters,
    selectedId,
    setSelectedId,
    selected,
    selectCard: selectCardInternal,
    reloadCard: reloadCardInternal,
    setCharacter,
    patchCharacter,
    removeCharacterById,
  } = useSelectedCharacter(repo)

  const { isDirty, recordSnapshot, markDirty, clearDirty, getSnapshot } = useDirtyState()

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

  const { saveStatus, saveError, handleSave: handleSaveCard, addCharacter, removeCharacter } = useCharacterMutations({
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

  // ── Публичные методы ─────────────────────────────────────────────────────────

  const selectCard = useCallback(async (id: string) => {
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

    patchCharacter(id, patch)

    if (newAvatarUrl !== undefined) {
      updateListItem(id, { avatar_url: newAvatarUrl ?? null })
      // Синхронизируем снимок при avatar-only обновлении
      const current = characters.get(id)
      if (current) recordSnapshot({ ...current, ...patch })
    }

    if (!avatarOnly) markDirty()
  }, [characters, patchCharacter, updateListItem, recordSnapshot, markDirty])

  const handleSave = useCallback(async () => {
    await handleSaveCard()
    await Promise.allSettled([...savePluginsRef.current.values()].map((fn) => fn()))
    clearCredentialDirty()
  }, [handleSaveCard, clearCredentialDirty])

  const discardChanges = useCallback(() => {
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
    // selection
    characters,
    selectedId,
    selected,
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
  }
}
