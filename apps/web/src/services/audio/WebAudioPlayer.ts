import type { IAudioPlayer } from '../../ports/IAudioPlayer'
import type { VisemeCue } from '../../ports/IVisemeProvider'
import type { LipSyncHandle } from '../../hooks/useLipSync'

/**
 * LSP: единственная реализация IAudioPlayer — заменяет MiniAudioPlayer (useChatChannel)
 * и AudioPlayer (useAudioStream). Оба хука используют один класс через интерфейс IAudioPlayer.
 *
 * Использует getter-функцию для получения LipSyncHandle, что позволяет:
 * - передавать ссылку через ref без пересоздания плеера (useChatChannel)
 * - передавать фиксированный handle через замыкание (useAudioStream)
 */
export class WebAudioPlayer implements IAudioPlayer {


  private readonly _getLipSync: () => LipSyncHandle | undefined
  private _ownCtx: AudioContext | null = null

  private _queue: Array<{ base64: string; timeline: VisemeCue[] | null }> = []
  private _correlationId: string | null = null
  private _activeSource: AudioBufferSourceNode | null = null
  private _playing = false
  private _destroyed = false
  
  constructor(getLipSync: () => LipSyncHandle | undefined) {
    this._getLipSync = getLipSync
  }


  enqueue(correlationId: string, audioBase64: string, timeline: VisemeCue[] | null): void {
    if (this._destroyed) return

    if (correlationId !== this._correlationId) {
      this._flush()
      this._correlationId = correlationId
    }

    this._queue.push({ base64: audioBase64, timeline })
    if (!this._playing) this._drain()
  }

  destroy(): void {
    this._destroyed = true
    this._flush()
    if (!this._getLipSync() && this._ownCtx) {
      this._ownCtx.close().catch(() => {})
    }
  }



  private _getCtx(): AudioContext {
    const lipSync = this._getLipSync()
    if (lipSync) return lipSync.getAudioContext()
    if (!this._ownCtx || this._ownCtx.state === 'closed') {
      this._ownCtx = new AudioContext()
    }
    return this._ownCtx
  }

  private _flush(): void {
    this._queue = []
    if (this._activeSource) {
      try {
        this._activeSource.onended = null
        this._activeSource.stop()
      } catch {
        /* already stopped */
      }
      this._activeSource = null
    }
    this._playing = false
    this._getLipSync()?.setVisemeTimeline(null, 0)
  }

  private _drain(): void {
    if (this._destroyed) return
    const item = this._queue.shift()
    if (!item) { this._playing = false; return }
    this._playing = true
    this._play(item)
  }

  private _play(item: { base64: string; timeline: VisemeCue[] | null }): void {
    const ctx = this._getCtx()
    const lipSync = this._getLipSync()
    const bytes = base64ToBytes(item.base64)

    ctx.decodeAudioData(bytes.buffer as ArrayBuffer)
      .then((buffer) => {
        if (this._destroyed || !this._playing) return

        const destination = lipSync ? lipSync.getAnalyserNode() : ctx.destination
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(destination)
        source.onended = () => {
          if (this._activeSource === source) this._activeSource = null
          this._drain()
        }
        this._activeSource = source

        const startT = ctx.currentTime
        source.start()

        if (item.timeline && lipSync) {
          lipSync.setVisemeTimeline(item.timeline, startT)
        }
      })
      .catch((err: unknown) => {
        console.error('[WebAudioPlayer] decodeAudioData failed', err)
        this._activeSource = null
        this._drain()
      })
  }



}

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}