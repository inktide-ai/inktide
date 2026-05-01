import {
  presignSceneUpload,
  completeSceneUpload,
  type AiCardSceneResponse,
} from '../../api/soul'
import type { IStorageUploader, PresignResult } from '@/types/IStorageUploader'

/**
 * OCP: аналог CardModelUploader для сцен (фоновых изображений).
 * Поддерживает опциональный `tag` для категоризации.
 */
export class CardSceneUploader implements IStorageUploader<AiCardSceneResponse> {
  constructor(
    private readonly cardId: string,
    private readonly tag?: string | null,
  ) {}

  presign(meta: { file_name: string; content_type: string; size_bytes: number }): Promise<PresignResult> {
    return presignSceneUpload(this.cardId, meta)
  }

  complete(payload: {
    storage_key: string
    file_name: string
    content_type: string
    size_bytes: number
  }): Promise<AiCardSceneResponse> {
    return completeSceneUpload(this.cardId, {
      storage_key: payload.storage_key,
      file_name: payload.file_name,
      content_type: payload.content_type,
      size_bytes: payload.size_bytes,
      tag: this.tag?.trim() || null,
    })
  }
}
