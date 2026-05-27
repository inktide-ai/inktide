'use client'
import { useEffect, useRef, useState } from 'react'
import type { CredentialResponse } from '@/shared/types/soul-api'
import { getCredentials, upsertCredential } from '@/entities/soul/api'
import type { ProviderDefinition } from '@/lib/providers'

export interface UseOllamaCredentialsResult {
  cred:           CredentialResponse | null
  credLoading:    boolean
  baseUrl:        string
  setBaseUrl:     (v: string) => void
  extraConfig:    Record<string, unknown>
  setExtraConfig: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  kvPairs:        Record<string, [string, string][]>
  setKvPairs:     React.Dispatch<React.SetStateAction<Record<string, [string, string][]>>>
}

/**
 * Loads Ollama credentials from the API, parses the config JSON blob into
 * `extraConfig` (scalar fields) and `kvPairs` (key-value pair fields), and
 * registers a save plugin so the parent panel's save action persists changes.
 */
export function useOllamaCredentials(
  def: ProviderDefinition,
  registerSavePlugin:   (key: string, fn: () => Promise<void>) => void,
  unregisterSavePlugin: (key: string) => void,
): UseOllamaCredentialsResult {
  const [cred, setCred]               = useState<CredentialResponse | null>(null)
  const [credLoading, setCredLoading] = useState(true)
  const [baseUrl, setBaseUrl]         = useState('')
  const [extraConfig, setExtraConfig] = useState<Record<string, unknown>>({})
  const [kvPairs, setKvPairs]         = useState<Record<string, [string, string][]>>({})

  // Stable refs used inside the save-plugin closure so it always reads current values
  // without needing to be re-registered on every keystroke.
  const baseUrlRef   = useRef(baseUrl)
  const extraRef     = useRef(extraConfig)
  const kvRef        = useRef(kvPairs)
  baseUrlRef.current = baseUrl
  extraRef.current   = extraConfig
  kvRef.current      = kvPairs

  // Register/unregister a save plugin that persists credential changes when the
  // user hits "Save". Uses refs so the closure is stable and never goes stale.
  useEffect(() => {
    const key = 'ollama-credential'
    registerSavePlugin(key, async () => {
      const configObj: Record<string, unknown> = { ...extraRef.current }
      def.extraFields?.forEach((f) => {
        if (f.type === 'kv-pairs') {
          const pairs = kvRef.current[f.key] ?? []
          if (pairs.length > 0)
            configObj[f.key] = Object.fromEntries(pairs.filter(([k]) => k.trim()))
        }
      })
      await upsertCredential(
        'ollama', null,
        baseUrlRef.current.trim() || null,
        Object.keys(configObj).length ? configObj : null,
      )
      const list = await getCredentials()
      setCred(list.find((c) => c.providerId === 'ollama') ?? null)
    })
    return () => unregisterSavePlugin(key)
  }, [registerSavePlugin, unregisterSavePlugin, def])

  // Load credentials on mount (or when def changes) and populate local state.
  useEffect(() => {
    getCredentials()
      .then((list) => {
        const found = list.find((c) => c.providerId === 'ollama') ?? null
        setCred(found)
        setBaseUrl(found?.baseUrl ?? def.defaultBaseUrl ?? '')
        if (found?.config) {
          try {
            const parsed = JSON.parse(found.config) as Record<string, unknown>
            const newExtra: Record<string, unknown> = {}
            const newKv: Record<string, [string, string][]> = {}
            def.extraFields?.forEach((f) => {
              if (f.type === 'kv-pairs') {
                const val = parsed[f.key]
                if (val && typeof val === 'object' && !Array.isArray(val))
                  newKv[f.key] = Object.entries(val as Record<string, string>)
              } else if (parsed[f.key] !== undefined) {
                newExtra[f.key] = parsed[f.key]
              }
            })
            setExtraConfig(newExtra)
            setKvPairs(newKv)
          } catch {}
        } else {
          const defaults: Record<string, unknown> = {}
          def.extraFields?.forEach((f) => {
            if (f.type !== 'kv-pairs' && f.default !== undefined) defaults[f.key] = f.default
          })
          setExtraConfig(defaults)
        }
      })
      .catch(() => {})
      .finally(() => setCredLoading(false))
  }, [def])

  return { cred, credLoading, baseUrl, setBaseUrl, extraConfig, setExtraConfig, kvPairs, setKvPairs }
}
