import type { LoadOptions } from '../engine/types'
import { AudioPlayerState } from './AudioPlayerState'
import { LoadingState } from './LoadingState'
import { PausedState } from './PausedState'

export class PlayingState extends AudioPlayerState {
  async load(uri: string, opts?: LoadOptions): Promise<void> {
    const nextState = new LoadingState(this.context)
    this.context.setState(nextState)
    await nextState.load(uri, opts)
  }

  async play(): Promise<void> {
    // Already playing, do nothing
  }

  async pause(): Promise<void> {
    await this.context.getEngine().pause()
    this.context.setState(new PausedState(this.context))
  }

  async togglePlayPause(): Promise<void> {
    await this.pause()
  }

  async seekTo(positionMs: number): Promise<void> {
    await this.context.getEngine().seekTo(positionMs)
  }
}
