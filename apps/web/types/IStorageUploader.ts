/** OCP: добавить новый тип медиазагрузки = создать новый класс с `implements IStorageUploader<T>`.
 *  Логика presign→PUT→complete написана один раз в PresignedUploadService.ts. */

export interface PresignResult {
  upload_url: string
  storage_key: string
  required_content_type: string
}

export interface IStorageUploader<TResult> {
  presign(meta: { file_name: string; content_type: string; size_bytes: number }): Promise<PresignResult>
  complete(payload: {
    storage_key: string
    file_name: string
    content_type: string
    size_bytes: number
    [k: string]: unknown
  }): Promise<TResult>
}
