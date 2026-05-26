import { useEffect, useState } from 'react'
import { getTtsVoices, type SpeechVoice } from '@/api/tts'

/**
 * Fetches the voice list for a TTS provider whenever the API key changes.
 * Debounces requests by 600ms to avoid hammering the API while the user types.
 *
 * @param providerId  - TTS provider identifier (e.g. 'elevenlabs', 'fishaudio')
 * @param apiKey      - User-supplied API key; empty string disables fetching
 * @param extraDep    - Optional extra dependency (e.g. region for Azure) that
 *                      triggers a refresh when changed
 */
export function useVoiceProvider(
  providerId: string,
  apiKey: string,
  extraDep?: string,
) {
  const [voices, setVoices] = useState<SpeechVoice[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!apiKey.trim()) {
      setVoices([])
      return
    }

    let cancelled = false

    const timer = setTimeout(() => {
      setLoading(true)
      getTtsVoices(providerId, apiKey)
        .then((list) => { if (!cancelled) setVoices(list) })
        .catch(() => { if (!cancelled) setVoices([]) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 600)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [providerId, apiKey, extraDep])

  return { voices, loading }
}
