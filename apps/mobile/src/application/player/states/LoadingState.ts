import type { LoadOptions } from '../engine/types'
import { AudioPlayerState } from './AudioPlayerState'
import { ErrorState } from './ErrorState'
import { PausedState } from './PausedState'
import { PlayingState } from './PlayingState'

export class LoadingState extends AudioPlayerState {
  async load(uri: string, opts?: LoadOptions): Promise<void> {
    try {
      await this.context.getEngine().load(uri, opts)
      if (opts?.shouldPlay) {
        this.context.setState(new PlayingState(this.context))
      } else {
        this.context.setState(new PausedState(this.context))
      }
    } catch (err: unknown) {
      console.error('[AudioPlayer] Error loading audio:', err)
      this.context.setState(new ErrorState(this.context, err instanceof Error ? err : new Error(String(err))))
      throw err
    }
  }

  // Play, pause, seek are ignored or deferred while loading
  async play(): Promise<void> {
    console.warn('[AudioPlayer] Play requested while loading, ignoring for now.')
  }

  async pause(): Promise<void> {
    console.warn('[AudioPlayer] Pause requested while loading, ignoring for now.')
  }

  async togglePlayPause(): Promise<void> {
    console.warn('[AudioPlayer] Toggle requested while loading, ignoring for now.')
  }

  async seekTo(positionMs: number): Promise<void> {
    console.warn('[AudioPlayer] Seek requested while loading, ignoring for now.')
  }
}
