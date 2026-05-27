import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of inactivity.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchTerm, 400)
 *   useEffect(() => { fetchResults(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debouncedValue
}
