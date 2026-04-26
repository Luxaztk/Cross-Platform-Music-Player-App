import type { LoadOptions } from '../engine/types'
import { AudioPlayerState } from './AudioPlayerState'
import { LoadingState } from './LoadingState'

export class IdleState extends AudioPlayerState {
  async load(uri: string, opts?: LoadOptions): Promise<void> {
    const nextState = new LoadingState(this.context)
    this.context.setState(nextState)
    await nextState.load(uri, opts)
  }
}
