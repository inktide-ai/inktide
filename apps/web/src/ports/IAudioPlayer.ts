import type { VisemeCue } from './IVisemeProvider'

/**
 * LSP: WebAudioPlayer полностью заменяет и AudioPlayer (useAudioStream),
 * и MiniAudioPlayer (useChatChannel). Оба хука работают с этим интерфейсом.
 */
export interface IAudioPlayer {
  enqueue(
    correlationId: string, 
    audioBase64: string,
     timeline: VisemeCue[] | null): void
  destroy(): void
}

export type { VisemeCue }
