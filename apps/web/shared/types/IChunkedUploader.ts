/** Server-side state of a resumable upload. */
export interface ChunkedUploadSession {
  upload_id: string
  size_bytes: number
  received_bytes: number
  chunk_bytes: number
}

/**
 * The endpoints of one resumable upload flow. The loop itself (retries, resume, progress)
 * is written once in ChunkedUploadService.ts; a new media type only implements these calls.
 */
export interface IChunkedUploader<TResult> {
  /** Same file for the same target gives the same key, so a reload resumes instead of starting over. */
  resumeKey(file: File): string
  start(meta: { file_name: string; size_bytes: number }): Promise<ChunkedUploadSession>
  /** Null when the server no longer knows the upload (expired or cancelled). */
  status(uploadId: string): Promise<ChunkedUploadSession | null>
  /**
   * Sends bytes starting at `offset`. Resolves to how many bytes the server holds afterwards,
   * also when it disagrees with `offset` (an earlier attempt got partly through).
   */
  putChunk(uploadId: string, offset: number, chunk: Blob): Promise<number>
  complete(uploadId: string): Promise<TResult>
}
