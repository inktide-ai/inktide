import { toast } from 'sonner'

export function handleError(err: unknown, fallback = 'Something went wrong'): void {
  const msg = err instanceof Error ? err.message : fallback
  toast.error(msg)
  console.error(err)
}
