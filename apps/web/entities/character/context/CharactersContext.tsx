'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { useCharacters, type SaveStatus } from '../hooks/useCharacters'
import type { AiCharacter } from '@/shared/lib/character'
import type { AiCardListItem, LlmModelResponse } from '@/shared/types/soul-api'

export interface CharactersContextValue {
  cardList: AiCardListItem[]
  characters: Map<string, AiCharacter>
  selectedId: string | null
  selected: AiCharacter | null
  cardLoadError: string | null
  loading: boolean
  loadError: string | null
  llmModels: LlmModelResponse[]
  isDirty: boolean
  saveStatus: SaveStatus
  saveError: string | null
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  selectCard: (id: string) => Promise<void>
  reloadCard: (id: string) => Promise<void>
  updateCharacter: (id: string, patch: Partial<AiCharacter>) => void
  discardChanges: () => void
  handleSave: () => Promise<void>
  addCharacter: (c: Omit<AiCharacter, 'id'>) => Promise<string | null>
  removeCharacter: (id: string) => Promise<void>
  registerSavePlugin: (key: string, fn: () => Promise<void>) => void
  unregisterSavePlugin: (key: string) => void
  markCredentialDirty: () => void
  clearSelection: () => void
}

const CharactersContext = createContext<CharactersContextValue | null>(null)

export function CharactersProvider({ children }: { children: ReactNode }) {
  const value = useCharacters()
  return (
    <CharactersContext.Provider value={value}>
      {children}
    </CharactersContext.Provider>
  )
}

export function useCharactersContext(): CharactersContextValue {
  const ctx = useContext(CharactersContext)
  if (!ctx) throw new Error('useCharactersContext must be used within <CharactersProvider>')
  return ctx
}

/** For UI that may render outside `CharactersProvider` (e.g. account modal on some shells). */
export function useOptionalCharactersContext(): CharactersContextValue | null {
  return useContext(CharactersContext)
}
