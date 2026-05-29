'use client'
import { useGlobalPreferences, usePatchGlobalPreferences } from './useGlobalPreferences'
import {
  DEFAULT_APPEARANCE_PREFS,
  applyUserAccent,
  type AppearancePrefs,
} from '@/shared/lib/user-appearance'

export function useAppearancePrefs(): {
  prefs: AppearancePrefs
  update: <K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) => void
} {
  const { data } = useGlobalPreferences()
  const { mutate } = usePatchGlobalPreferences()

  const prefs: AppearancePrefs = data?.appearance
    ? {
        theme: data.appearance.theme as AppearancePrefs['theme'],
        accentColor: data.appearance.accentColor,
        fontSize: data.appearance.fontSize as AppearancePrefs['fontSize'],
        compact: data.appearance.compact,
        reduceMotion: data.appearance.reduceMotion,
      }
    : DEFAULT_APPEARANCE_PREFS

  function update<K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) {
    const next = { ...prefs, [key]: value }
    mutate({ appearance: next })
    if (key === 'accentColor') applyUserAccent(value as string)
  }

  return { prefs, update }
}
