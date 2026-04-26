import type { LoadOptions } from '../engine/types'
import type { PlayerService } from '../PlayerService'

export abstract class AudioPlayerState {
  constructor(protected context: PlayerService) {}

  async load(uri: string, opts?: LoadOptions): Promise<void> {
    console.warn(`[AudioPlayer] Cannot load in state: ${this.getName()}`)
  }

  async play(): Promise<void> {
    console.warn(`[AudioPlayer] Cannot play in state: ${this.getName()}`)
  }

  async pause(): Promise<void> {
    console.warn(`[AudioPlayer] Cannot pause in state: ${this.getName()}`)
  }

  async togglePlayPause(): Promise<void> {
    console.warn(`[AudioPlayer] Cannot toggle play/pause in state: ${this.getName()}`)
  }

  async seekTo(positionMs: number): Promise<void> {
    console.warn(`[AudioPlayer] Cannot seek in state: ${this.getName()}`)
  }

  getName(): string {
    return this.constructor.name
  }
}
