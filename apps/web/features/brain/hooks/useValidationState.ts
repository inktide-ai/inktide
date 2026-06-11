import { useRef, useState } from 'react'

type AutoState   = 'idle' | 'ok' | 'failed'
type ManualState = 'idle' | 'testing' | 'ok' | 'failed'

export interface ValidationState {
  autoState: AutoState
  autoError: string | null
  manualState: ManualState
  manualError: string | null
  bypassed: boolean
  setBypassed: (v: boolean) => void
  triggerAutoValidation: (value: string) => void
  runTest: () => Promise<void>
}

export function useValidationState(
  autoValidateFn: (value: string) => string | null | undefined,
  manualTestFn: () => Promise<string | null>,
): ValidationState {
  
  const [autoState, setAutoState]     = useState<AutoState>('idle')
  const [autoError, setAutoError]     = useState<string | null>(null)
  const [manualState, setManualState] = useState<ManualState>('idle')
  const [manualError, setManualError] = useState<string | null>(null)
  const [bypassed, setBypassed]       = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerAutoValidation = (value: string) => {
    setBypassed(false); setManualState('idle'); setManualError(null)
    setAutoState('idle'); setAutoError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const err = autoValidateFn(value)
      setAutoState(err ? 'failed' : 'ok'); setAutoError(err ?? null)
    }, 300)
  }

  const runTest = async () => {
    setManualState('testing'); setManualError(null); setBypassed(false)
    const err = await manualTestFn()
    setManualState(err ? 'failed' : 'ok'); setManualError(err)
  }

  return { autoState, autoError, manualState, manualError, bypassed, setBypassed, triggerAutoValidation, runTest }
}
