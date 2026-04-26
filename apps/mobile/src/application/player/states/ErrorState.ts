import type { LoadOptions } from '../engine/types'
import { AudioPlayerState } from './AudioPlayerState'
import { LoadingState } from './LoadingState'

export class ErrorState extends AudioPlayerState {
  constructor(context: any, public readonly error: Error) {
    super(context)
  }

  async load(uri: string, opts?: LoadOptions): Promise<void> {
    const nextState = new LoadingState(this.context)
    this.context.setState(nextState)
    await nextState.load(uri, opts)
  }

  async play(): Promise<void> {
    console.warn('[AudioPlayer] Cannot play in Error state')
  }

  async pause(): Promise<void> {
    console.warn('[AudioPlayer] Cannot pause in Error state')
  }

  async togglePlayPause(): Promise<void> {
    console.warn('[AudioPlayer] Cannot toggle play/pause in Error state')
  }

  async seekTo(positionMs: number): Promise<void> {
    console.warn('[AudioPlayer] Cannot seek in Error state')
  }
}
