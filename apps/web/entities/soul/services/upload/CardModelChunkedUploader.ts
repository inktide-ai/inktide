import type { AiCardModelResponse } from '@/shared/types/soul-api'
import type { ChunkedUploadSession, IChunkedUploader } from '@/shared/types/IChunkedUploader'
import {
  startCardModelChunkedUpload,
  getCardModelChunkedUpload,
  putCardModelChunk,
  completeCardModelChunkedUpload,
} from '@/entities/soul/api'

/** Resumable uploads of a card's 3D model; the retry and resume loop lives in ChunkedUploadService.ts. */
export class CardModelChunkedUploader implements IChunkedUploader<AiCardModelResponse> {
  constructor(private readonly cardId: string) {}

  resumeKey(file: File): string {
    return `card-model:${this.cardId}:${file.name}:${file.size}:${file.lastModified}`
  }

  start(meta: { file_name: string; size_bytes: number }): Promise<ChunkedUploadSession> {
    return startCardModelChunkedUpload(this.cardId, meta)
  }

  status(uploadId: string): Promise<ChunkedUploadSession | null> {
    return getCardModelChunkedUpload(this.cardId, uploadId)
  }

  putChunk(uploadId: string, offset: number, chunk: Blob): Promise<number> {
    return putCardModelChunk(this.cardId, uploadId, offset, chunk)
  }

  complete(uploadId: string): Promise<AiCardModelResponse> {
    return completeCardModelChunkedUpload(this.cardId, uploadId)
  }
}
