import { ApiError } from '../../api/client'
import type { IStorageUploader } from '@/types/IStorageUploader'

/**
 * OCP + DRY: паттерн presign→PUT→complete написан ОДИН РАЗ.
 * Добавить новый тип медиазагрузки = создать новый класс `implements IStorageUploader<T>`.
 * Этот файл не меняется.
 */
export async function executePresignedUpload<TResult>(
  uploader: IStorageUploader<TResult>,
  file: File,
  extra?: Record<string, unknown>,
): Promise<TResult> {
  const contentType = file.type.trim() || 'application/octet-stream'
  const presign = await uploader.presign({
    file_name: file.name,
    content_type: contentType,
    size_bytes: file.size,
  })

  const putRes = await fetch(presign.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': presign.required_content_type },
    body: file,
  })
  if (!putRes.ok) {
    throw new ApiError(putRes.status, `Storage upload failed (${putRes.status})`)
  }

  return uploader.complete({
    storage_key: presign.storage_key,
    file_name: file.name,
    content_type: presign.required_content_type,
    size_bytes: file.size,
    ...extra,
  })
}
