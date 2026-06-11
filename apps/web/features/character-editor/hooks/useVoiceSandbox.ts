'use client'
import { useEffect, useState } from 'react'
import { getTtsProviders, getTtsVoices, type SpeechProviderDescriptor, type SpeechVoice } from '@/features/soul/api/tts'

function getFallbackVoices(_providerId: string): SpeechVoice[] { return [] }

export interface UseVoiceSandboxResult {
  providers:           SpeechProviderDescriptor[]
  providersLoading:    boolean
  selectedProviderId:  string
  setSelectedProviderId: (id: string) => void
  voices:              SpeechVoice[]
  voicesLoading:       boolean
  /** Resolved provider object for the current selectedProviderId */
  provider:            SpeechProviderDescriptor | undefined
  needsApiKey:         boolean
  canListVoices:       boolean
  canStream:           boolean
}

/**
 * Manages TTS provider and voice lists for the voice sandbox.
 *
 * @param initialProviderId  Initial provider selection (from character.tts.providerId).
 */
export function useVoiceSandbox(initialProviderId: string): UseVoiceSandboxResult {
  const [providers, setProviders]               = useState<SpeechProviderDescriptor[]>([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [selectedProviderId, setSelectedProviderId] = useState(initialProviderId)
  const [voices, setVoices]                     = useState<SpeechVoice[]>([])
  const [voicesLoading, setVoicesLoading]       = useState(false)

  // Fetch providers once on mount. selectedProviderId is intentionally excluded
  // from deps: adding it would re-fetch (and potentially reset selection) on every
  // provider change triggered by the user.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false
    setProvidersLoading(true)
    getTtsProviders()
      .then((list) => {
        if (cancelled) return
        setProviders(list)
        if (list.length > 0 && !list.find((p) => p.id === selectedProviderId))
          setSelectedProviderId(list[0].id)
      })
      .catch((err) => { console.error('[useVoiceSandbox] failed to load TTS providers', err) })
      .finally(() => { if (!cancelled) setProvidersLoading(false) })
    return () => { cancelled = true }
  }, []) // intentional: selectedProviderId excluded — refetch on navigation would reset selection

  const provider      = providers.find((p) => p.id === selectedProviderId)
  const needsApiKey   = provider?.capabilities.requiresApiKey ?? false
  const canListVoices = provider?.capabilities.supportsVoiceListing ?? false
  const canStream     = provider?.capabilities.supportsStreaming ?? false

  // Fetch voices whenever the selected provider changes, or when providers finish
  // loading. needsApiKey and apiKey are intentionally excluded: apiKey is a
  // UI-only field (for ad-hoc testing) and its changes must not retrigger a
  // voice list refetch which would discard the current selection.
  useEffect(() => {
    if (!selectedProviderId) return
    if (!canListVoices) { setVoices([]); return }
    let cancelled = false
    setVoicesLoading(true)
    setVoices([])
    getTtsVoices(selectedProviderId)
      .then((list) => {
        if (cancelled) return
        setVoices(list.length > 0 ? list : getFallbackVoices(selectedProviderId))
      })
      .catch(() => { if (!cancelled) setVoices(getFallbackVoices(selectedProviderId)) })
      .finally(() => { if (!cancelled) setVoicesLoading(false) })
    return () => { cancelled = true }
    // intentional: needsApiKey/apiKey excluded — apiKey changes must not trigger voice refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProviderId, providers])

  return {
    providers, providersLoading, selectedProviderId, setSelectedProviderId,
    voices, voicesLoading, provider, needsApiKey, canListVoices, canStream,
  }
}
