import { describe, it, expect, vi } from 'vitest'
import { ApiError } from '@/api/client'
import type { ChunkedUploadSession, IChunkedUploader } from '@/shared/types/IChunkedUploader'
import { executeChunkedUpload, RETRY_DELAYS_MS } from '../ChunkedUploadService'

const CHUNK = 4

function readBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

/** In-memory server with the same offset rules as the API. */
class FakeServer implements IChunkedUploader<{ bytes: number[] }> {
  bytes: number[] = []
  started = 0
  puts: number[] = []
  /** On the `call`-th putChunk, keep `keep` bytes of the chunk and then fail like a dropped connection. */
  drop: { call: number; keep: number } | null = null
  failWith: unknown = null

  resumeKey = (file: File) => `fake:${file.name}:${file.size}`

  async start(): Promise<ChunkedUploadSession> {
    this.started++
    this.bytes = []
    return this.session()
  }

  async status(): Promise<ChunkedUploadSession | null> {
    return this.session()
  }

  async putChunk(_id: string, offset: number, chunk: Blob): Promise<number> {
    this.puts.push(offset)
    if (this.failWith) throw this.failWith
    if (offset !== this.bytes.length) return this.bytes.length // the API's 409 carries this number
    const data = [...await readBytes(chunk)]
    if (this.drop?.call === this.puts.length) {
      this.bytes.push(...data.slice(0, this.drop.keep))
      throw new TypeError('Failed to fetch')
    }
    this.bytes.push(...data)
    return this.bytes.length
  }

  async complete(): Promise<{ bytes: number[] }> {
    return { bytes: this.bytes }
  }

  private session(): ChunkedUploadSession {
    return { upload_id: 'u1', size_bytes: 10, received_bytes: this.bytes.length, chunk_bytes: CHUNK }
  }
}

const file = () => new File([new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])], 'm.vrm')
const noSleep = () => Promise.resolve()

describe('executeChunkedUpload', () => {
  it('sends the file in chunks and reports progress up to the full size', async () => {
    const server = new FakeServer()
    const progress: number[] = []

    const result = await executeChunkedUpload(server, file(), {
      sleep: noSleep, storage: null, onProgress: sent => progress.push(sent),
    })

    expect(result.bytes).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(server.puts).toEqual([0, 4, 8])
    expect(progress[progress.length - 1]).toBe(10)
  })

  it('after a connection drops mid-chunk, continues from the bytes the server kept', async () => {
    const server = new FakeServer()
    server.drop = { call: 2, keep: 2 } // the second chunk dies after 2 of its 4 bytes
    const onRetry = vi.fn()

    const result = await executeChunkedUpload(server, file(), { sleep: noSleep, storage: null, onRetry })

    expect(result.bytes).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(onRetry).toHaveBeenCalledTimes(1)
    // retry of offset 4 learns the server is at 6, then sends 6.. and 10 is reached in one more chunk
    expect(server.puts).toEqual([0, 4, 4, 6])
  })

  it('resumes a saved upload instead of starting again', async () => {
    const server = new FakeServer()
    server.bytes = [0, 1, 2, 3, 4, 5]
    const saved = new Map([['inktide:upload:fake:m.vrm:10', 'u1']])
    const storage = {
      getItem: (k: string) => saved.get(k) ?? null,
      setItem: (k: string, v: string) => void saved.set(k, v),
      removeItem: (k: string) => void saved.delete(k),
    }

    const result = await executeChunkedUpload(server, file(), { sleep: noSleep, storage })

    expect(server.started).toBe(0)
    expect(server.puts[0]).toBe(6)
    expect(result.bytes).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(saved.size).toBe(0)
  })

  it('does not retry a request the server rejected', async () => {
    const server = new FakeServer()
    server.failWith = new ApiError(400, 'bad chunk')

    await expect(executeChunkedUpload(server, file(), { sleep: noSleep, storage: null }))
      .rejects.toThrow('bad chunk')
    expect(server.puts).toHaveLength(1)
  })

  it('gives up after the last retry when the network stays down', async () => {
    const server = new FakeServer()
    server.failWith = new TypeError('Failed to fetch')
    const sleep = vi.fn((_ms: number) => Promise.resolve())

    await expect(executeChunkedUpload(server, file(), { sleep, storage: null }))
      .rejects.toThrow('Failed to fetch')
    expect(server.puts).toHaveLength(RETRY_DELAYS_MS.length + 1)
    expect(sleep.mock.calls.map(c => c[0])).toEqual(RETRY_DELAYS_MS)
  })
})
