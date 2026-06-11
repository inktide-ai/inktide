import type { ProjectSceneResponse } from '@/features/projects/api/scenes'
import { presignProjectScene, completeProjectSceneUpload } from '@/features/projects/api/scenes'
import type { IStorageUploader, PresignResult } from '@/shared/types/IStorageUploader'

export class CardSceneUploader implements IStorageUploader<ProjectSceneResponse> {
  constructor(private readonly projectId: string) {}

  presign(meta: { file_name: string; content_type: string; size_bytes: number }): Promise<PresignResult> {
    return presignProjectScene(this.projectId, meta)
  }

  complete(payload: {
    storage_key: string
    file_name: string
    content_type: string
    size_bytes: number
  }): Promise<ProjectSceneResponse> {
    return completeProjectSceneUpload(this.projectId, {
      storage_key: payload.storage_key,
      file_name: payload.file_name,
      content_type: payload.content_type,
      size_bytes: payload.size_bytes,
    })
  }
}
