import { useCallback, useState } from 'react'
import { handleError } from '@/shared/lib/handle-error'

export function useClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), resetDelay)
      })
      .catch(handleError)
  }, [resetDelay])

  return { copied, copy }
}
