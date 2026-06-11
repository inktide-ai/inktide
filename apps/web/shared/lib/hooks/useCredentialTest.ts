import { useState } from 'react'
import { upsertCredential, testCredential } from '@/entities/soul/api'
import type { CredentialStatus } from '@/shared/ui/credential-status-badge'

export interface CredentialTestState {
  status: CredentialStatus
  error: string | null
  testing: boolean
  /** Returns true if the credential test passed. */
  test: (apiKey?: string | null, baseUrl?: string | null) => Promise<boolean>
  reset: () => void
  setStatus: (status: CredentialStatus) => void
}

export function useCredentialTest(
  providerId: string,
  initialStatus: CredentialStatus = 'untested',
): CredentialTestState {
  const [status, setStatus]   = useState<CredentialStatus>(initialStatus)
  const [error, setError]     = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const test = async (apiKey?: string | null, baseUrl?: string | null): Promise<boolean> => {
    setTesting(true)
    setError(null)
    try {
      if (apiKey?.trim()) await upsertCredential(providerId, apiKey, baseUrl ?? null)
      const result = await testCredential(providerId)
      const succeeded = result.success ?? false
      setStatus(succeeded ? 'verified' : 'failed')
      setError(result.error ?? null)
      return succeeded
    } catch (err) {
      setStatus('failed')
      setError(err instanceof Error ? err.message : 'Unexpected error')
      return false
    } finally {
      setTesting(false)
    }
  }

  const reset = () => { setStatus('untested'); setError(null) }

  return { status, error, testing, test, reset, setStatus }
}
