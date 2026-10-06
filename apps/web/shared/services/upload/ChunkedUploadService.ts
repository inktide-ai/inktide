import { ApiError } from '@/api/client'
import type { ChunkedUploadSession, IChunkedUploader } from '@/shared/types/IChunkedUploader'

/** Pauses between attempts at one request; after the last one the upload gives up. */
export const RETRY_DELAYS_MS = [1_000, 3_000, 5_000, 10_000, 20_000]

const RESUME_PREFIX = 'inktide:upload:'

type ResumeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface ChunkedUploadOptions {
  onProgress?: (sentBytes: number, totalBytes: number) => void
  /** Called before waiting to retry, so the UI can say the connection dropped. */
  onRetry?: (attempt: number, error: unknown) => void
  /** Test seams. */
  sleep?: (ms: number) => Promise<void>
  storage?: ResumeStorage | null
}

/**
 * Uploads `file` in small chunks, the way Telegram and Google's resumable uploads do: a dropped
 * connection costs one chunk, not the whole file, and reopening the page continues where it stopped.
 */
export async function executeChunkedUpload<TResult>(
  uploader: IChunkedUploader<TResult>,
  file: File,
  options: ChunkedUploadOptions = {},
): Promise<TResult> {
  const { onProgress, onRetry } = options
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)))
  const storage = options.storage === undefined ? browserStorage() : options.storage
  const key = RESUME_PREFIX + uploader.resumeKey(file)
  const retry = <T,>(fn: () => Promise<T>) => withRetry(fn, sleep, onRetry)

  const startFresh = async () => {
    const session = await retry(() => uploader.start({ file_name: file.name, size_bytes: file.size }))
    remember(storage, key, session.upload_id)
    return session
  }

  let session = await resumed(uploader, file, storage, key, retry) ?? await startFresh()
  let offset = session.received_bytes
  let restarted = false
  onProgress?.(offset, file.size)

  for (let round = 0; ; round++) {
    while (offset < file.size) {
      const from = offset
      const chunk = file.slice(from, Math.min(from + session.chunk_bytes, file.size))
      try {
        offset = await retry(() => uploader.putChunk(session.upload_id, from, chunk))
      } catch (err) {
        // The server lost the upload (restart, expiry): start over once rather than fail.
        if (!(err instanceof ApiError && err.status === 404) || restarted) throw err
        restarted = true
        session = await startFresh()
        offset = 0
      }
      onProgress?.(offset, file.size)
    }

    try {
      const result = await retry(() => uploader.complete(session.upload_id))
      forget(storage, key)
      return result
    } catch (err) {
      // 409: the server holds fewer bytes than we sent; ask how many and send the rest.
      if (!(err instanceof ApiError && err.status === 409) || round >= 2) throw err
      const fresh = await retry(() => uploader.status(session.upload_id))
      if (!fresh) throw err
      offset = fresh.received_bytes
    }
  }
}

async function resumed<TResult>(
  uploader: IChunkedUploader<TResult>,
  file: File,
  storage: ResumeStorage | null,
  key: string,
  retry: <T>(fn: () => Promise<T>) => Promise<T>,
): Promise<ChunkedUploadSession | null> {
  const uploadId = read(storage, key)
  if (!uploadId) return null
  const session = await retry(() => uploader.status(uploadId)).catch(() => null)
  if (session && session.size_bytes === file.size) return session
  forget(storage, key)
  return null
}

async function withRetry<T>(
  fn: () => Promise<T>,
  sleep: (ms: number) => Promise<void>,
  onRetry?: (attempt: number, error: unknown) => void,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (!isRetryable(err) || attempt >= RETRY_DELAYS_MS.length) throw err
      onRetry?.(attempt + 1, err)
      await sleep(RETRY_DELAYS_MS[attempt])
    }
  }
}

/** A dropped connection (fetch rejects with TypeError) or a server hiccup is worth another try; a 4xx is not. */
function isRetryable(err: unknown): boolean {
  if (err instanceof ApiError) return err.status >= 500 || err.status === 408 || err.status === 429
  return err instanceof TypeError
}

// localStorage can be missing or throw (private mode, blocked site data); resume is a convenience.
function browserStorage(): ResumeStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage } catch { return null }
}
function read(storage: ResumeStorage | null, key: string): string | null {
  try { return storage?.getItem(key) ?? null } catch { return null }
}
function remember(storage: ResumeStorage | null, key: string, value: string): void {
  try { storage?.setItem(key, value) } catch { /* resume just won't work */ }
}
function forget(storage: ResumeStorage | null, key: string): void {
  try { storage?.removeItem(key) } catch { /* nothing to clean */ }
}
