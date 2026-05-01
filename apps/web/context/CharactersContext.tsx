'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { useCharacters, type SaveStatus } from '../hooks/useCharacters'
import type { AiCharacter } from '@/lib/character'
import type { AiCardListItem, LlmModelResponse } from '../api/soul'

export interface CharactersContextValue {
  cardList: AiCardListItem[]
  characters: Map<string, AiCharacter>
  selectedId: string | null
  selected: AiCharacter | null
  loading: boolean
  loadError: string | null
  llmModels: LlmModelResponse[]
  isDirty: boolean
  saveStatus: SaveStatus
  saveError: string | null
  selectCard: (id: string) => Promise<void>
  reloadCard: (id: string) => Promise<void>
  updateCharacter: (id: string, patch: Partial<AiCharacter>) => void
  discardChanges: () => void
  handleSave: () => Promise<void>
  addCharacter: (c: Omit<AiCharacter, 'id'>) => Promise<void>
  removeCharacter: (id: string) => Promise<void>
  registerSavePlugin: (key: string, fn: () => Promise<void>) => void
  unregisterSavePlugin: (key: string) => void
  markCredentialDirty: () => void
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
