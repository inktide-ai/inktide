import { ApiError } from '@/api/client'
import type { IStorageUploader } from '@/shared/types/IStorageUploader'

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'model/gltf-binary',
  'model/vrm',
  'application/octet-stream',
])

// Browsers report application/octet-stream for .vrm and .glb — validate by extension
// so a renamed .html cannot slip through the MIME check.
const OCTET_STREAM_ALLOWED_EXTS = new Set(['vrm', 'glb'])

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
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new ApiError(415, `Unsupported file type: ${contentType}`)
  }
  if (contentType === 'application/octet-stream') {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!OCTET_STREAM_ALLOWED_EXTS.has(ext)) {
      throw new ApiError(415, `Unsupported file type: ${contentType}`)
    }
  }
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
