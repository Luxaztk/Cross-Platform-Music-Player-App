import type { LoadOptions } from '../engine/types'
import { AudioPlayerState } from './AudioPlayerState'
import { LoadingState } from './LoadingState'
import { PlayingState } from './PlayingState'

export class PausedState extends AudioPlayerState {
  async load(uri: string, opts?: LoadOptions): Promise<void> {
    const nextState = new LoadingState(this.context)
    this.context.setState(nextState)
    await nextState.load(uri, opts)
  }

  async play(): Promise<void> {
    await this.context.getEngine().play()
    this.context.setState(new PlayingState(this.context))
  }

  async pause(): Promise<void> {
    // Already paused, do nothing
  }

  async togglePlayPause(): Promise<void> {
    await this.play()
  }

  async seekTo(positionMs: number): Promise<void> {
    await this.context.getEngine().seekTo(positionMs)
  }
}
