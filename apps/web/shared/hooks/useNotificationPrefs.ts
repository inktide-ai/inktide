'use client'
import { useGlobalPreferences, usePatchGlobalPreferences } from './useGlobalPreferences'
import type { NotifPrefDto } from '@/api/preferences'

export type NotifPrefs = NotifPrefDto

export const DEFAULT_PREFS: NotifPrefs = {
  enabled: true,
  emailMentions: true,
  emailMessages: true,
  emailProjectUpdates: false,
  emailSystem: true,
  pushMentions: true,
  pushMessages: false,
  pushReminders: false,
}

export function useNotificationPrefs() {
  const { data } = useGlobalPreferences()
  const { mutate } = usePatchGlobalPreferences()

  const prefs: NotifPrefs = data?.notifications ?? DEFAULT_PREFS

  function update<K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) {
    mutate({ notifications: { ...prefs, [key]: value } })
  }

  return { prefs, update }
}
