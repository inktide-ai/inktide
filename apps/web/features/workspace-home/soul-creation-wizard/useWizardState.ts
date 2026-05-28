'use client'
import { useCallback, useEffect, useReducer } from 'react'
import type { CharacterPersonality } from '@/shared/lib/character'
import type { SoulTemplate } from '@/shared/data/soul-templates'
import { STORAGE_KEYS } from '@/shared/lib/storage-keys'

// ── Types ──────────────────────────────────────────────────────────────────

export type Screen = 'templates' | 'steps' | 'llm' | 'tts' | 'channels' | 'finish'
export type StepSelection = { id: string; name: string; config?: Record<string, string> }

// ── TTL-based persistence ──────────────────────────────────────────────────

const WIZARD_TTL_MS = 24 * 60 * 60 * 1000

function loadWithTTL<T>(key: string, fallback: T): T {
  // SSR guard: window is unavailable during server-side rendering
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const { value, ts } = JSON.parse(raw) as { value: T; ts: number }
    if (Date.now() - ts > WIZARD_TTL_MS) { localStorage.removeItem(key); return fallback }
    return value
  } catch { return fallback }
}

function saveWithTTL(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify({ value, ts: Date.now() })) } catch { /* quota */ }
}

// ── Default personality ────────────────────────────────────────────────────

const DEFAULT_PERSONALITY: CharacterPersonality = {
  warmth: 0.7, playfulness: 0.5, assertiveness: 0.5, empathy: 0.7,
  formality: 0.3, sarcasm: 0.2, emotionVolatility: 0.5,
  emotionResponsiveness: 0.7, emotionMemory: 0.5,
  stressBehavior: 'deflect', baselineMood: 'neutral', presetId: null,
}

// ── Reducer ────────────────────────────────────────────────────────────────

type WizardState = {
  screen:               Screen
  direction:            1 | -1
  selectedTemplate:     string | null
  stepSelections:       Record<string, StepSelection>
  personalityOpen:      boolean
  personalityConfig:    CharacterPersonality
  personalityConfigured: boolean
  channelsSelected:     string[]
}

type WizardAction =
  | { type: 'NAVIGATE';          to: Screen; dir: 1 | -1 }
  | { type: 'SELECT_TEMPLATE';   id: string | null }
  | { type: 'SELECT_PROVIDER';   stepId: string; id: string; name: string; config?: Record<string, string> }
  | { type: 'SET_PERSONALITY';   config: CharacterPersonality }
  | { type: 'OPEN_PERSONALITY' }
  | { type: 'CLOSE_PERSONALITY' }
  | { type: 'CONFIRM_CHANNELS';  channels: string[]; selections: Record<string, StepSelection> }

// IMPORTANT: each case must return the same object reference for fields that
// didn't change. The persist effects below use reference equality — spreading
// an unchanged field creates a new reference and fires a spurious saveWithTTL.
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'NAVIGATE':
      // stepSelections / personalityConfig / channelsSelected — same refs, persist won't fire
      return { ...state, screen: action.to, direction: action.dir }

    case 'SELECT_TEMPLATE':
      // stepSelections / personalityConfig / channelsSelected — same refs
      return { ...state, screen: 'steps', direction: 1, selectedTemplate: action.id }

    case 'SELECT_PROVIDER':
      // personalityConfig / channelsSelected — same refs; stepSelections — NEW ref (intentional persist)
      return {
        ...state,
        screen: 'steps',
        direction: -1,
        stepSelections: { ...state.stepSelections, [action.stepId]: { id: action.id, name: action.name, config: action.config } },
      }

    case 'SET_PERSONALITY':
      // stepSelections / channelsSelected — same refs; personalityConfig — NEW ref (intentional persist)
      return { ...state, personalityConfig: action.config }

    case 'OPEN_PERSONALITY':
      // stepSelections / personalityConfig / channelsSelected — same refs
      return { ...state, personalityOpen: true }

    case 'CLOSE_PERSONALITY':
      // stepSelections / personalityConfig / channelsSelected — same refs
      return { ...state, personalityOpen: false, personalityConfigured: true }

    case 'CONFIRM_CHANNELS':
      // personalityConfig — same ref; channelsSelected / stepSelections — NEW refs (intentional persist)
      return { ...state, screen: 'steps', direction: -1, channelsSelected: action.channels, stepSelections: action.selections }

    default:
      return state
  }
}

// ── Lazy initializer (SSR-safe) ────────────────────────────────────────────

function initState(): WizardState {
  return {
    screen:            'templates',
    direction:         1,
    selectedTemplate:  null,
    stepSelections:    loadWithTTL<Record<string, StepSelection>>(STORAGE_KEYS.wizard.selections, {}),
    personalityOpen:   false,
    personalityConfig: loadWithTTL<CharacterPersonality>(STORAGE_KEYS.wizard.personality, DEFAULT_PERSONALITY),
    // SSR guard: localStorage.getItem is unavailable on the server
    personalityConfigured: typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.wizard.personality) !== null,
    channelsSelected:  loadWithTTL<string[]>(STORAGE_KEYS.wizard.channels, []),
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────

export interface UseWizardStateResult {
  state:           WizardState
  navigate:        (to: Screen, dir: 1 | -1) => void
  selectTemplate:  (tmpl: SoulTemplate | null) => void
  selectProvider:  (stepId: string, id: string, name: string, config?: Record<string, string>) => void
  setPersonality:  (p: CharacterPersonality) => void
  openPersonality: () => void
  closePersonality: () => void
  confirmChannels: (channels: string[], selections: Record<string, StepSelection>) => void
  clearDraft:      () => void
}

export function useWizardState(): UseWizardStateResult {
  const [state, dispatch] = useReducer(wizardReducer, undefined, initState)

  // Persist each data field only when its reference actually changes.
  // Reducer cases that don't touch a field return state.field unchanged,
  // so these effects are silent on unrelated transitions.
  useEffect(() => { saveWithTTL(STORAGE_KEYS.wizard.selections,  state.stepSelections) },  [state.stepSelections])
  useEffect(() => { saveWithTTL(STORAGE_KEYS.wizard.personality, state.personalityConfig) }, [state.personalityConfig])
  useEffect(() => { saveWithTTL(STORAGE_KEYS.wizard.channels,    state.channelsSelected) },  [state.channelsSelected])

  const navigate = useCallback((to: Screen, dir: 1 | -1) =>
    dispatch({ type: 'NAVIGATE', to, dir }), [])

  // Template selection has an additional side effect: persist the full template
  // object (id + personality string) so clearWizardDraft can remove it.
  const selectTemplate = useCallback((tmpl: SoulTemplate | null) => {
    dispatch({ type: 'SELECT_TEMPLATE', id: tmpl?.id ?? null })
    if (typeof window !== 'undefined') {
      if (tmpl) {
        saveWithTTL(STORAGE_KEYS.wizard.template, { id: tmpl.id, personality: tmpl.personality })
      } else {
        localStorage.removeItem(STORAGE_KEYS.wizard.template)
      }
    }
  }, [])

  const selectProvider = useCallback((stepId: string, id: string, name: string, config?: Record<string, string>) =>
    dispatch({ type: 'SELECT_PROVIDER', stepId, id, name, config }), [])

  const setPersonality = useCallback((config: CharacterPersonality) =>
    dispatch({ type: 'SET_PERSONALITY', config }), [])

  const openPersonality  = useCallback(() => dispatch({ type: 'OPEN_PERSONALITY' }),  [])
  const closePersonality = useCallback(() => dispatch({ type: 'CLOSE_PERSONALITY' }), [])

  const confirmChannels = useCallback((channels: string[], selections: Record<string, StepSelection>) =>
    dispatch({ type: 'CONFIRM_CHANNELS', channels, selections }), [])

  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') Object.values(STORAGE_KEYS.wizard).forEach(k => localStorage.removeItem(k))
  }, [])

  return { state, navigate, selectTemplate, selectProvider, setPersonality, openPersonality, closePersonality, confirmChannels, clearDraft }
}
