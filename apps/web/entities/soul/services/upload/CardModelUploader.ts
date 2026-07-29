import type { AiCardModelResponse } from '@/shared/types/soul-api'
import { presignCardModelUpload, completeCardModelUpload } from '@/entities/soul/api'
import type { IStorageUploader, PresignResult } from '@/shared/types/IStorageUploader'

/**
 * OCP: этот класс добавлен как новый файл - uploadCardModelFile() удалён из soul.ts.
 * Логика PUT в MinIO живёт в PresignedUploadService, здесь только специфика эндпоинтов.
 */
export class CardModelUploader implements IStorageUploader<AiCardModelResponse> {
  constructor(private readonly cardId: string) {}

  presign(meta: { file_name: string; content_type: string; size_bytes: number }): Promise<PresignResult> {
    return presignCardModelUpload(this.cardId, meta)
  }

  complete(payload: {
    storage_key: string
    file_name: string
    content_type: string
    size_bytes: number
  }): Promise<AiCardModelResponse> {
    return completeCardModelUpload(this.cardId, {
      storage_key: payload.storage_key,
      file_name: payload.file_name,
      content_type: payload.content_type,
      size_bytes: payload.size_bytes,
    })
  }
}
