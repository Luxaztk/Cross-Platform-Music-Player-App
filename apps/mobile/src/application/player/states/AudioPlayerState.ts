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

export class IdleState extends AudioPlayerState {
  async load(uri: string, opts?: LoadOptions): Promise<void> {
    const nextState = new LoadingState(this.context)
    this.context.setState(nextState)
    await nextState.load(uri, opts)
  }

  async play(): Promise<void> {
    // No song loaded, cannot play
  }

  async togglePlayPause(): Promise<void> {
    // No song loaded, cannot toggle
  }
}

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

  async play(): Promise<void> {
    // Already loading, will play once finished if shouldPlay was true
  }

  async pause(): Promise<void> {
    // Cannot pause while loading
  }

  async togglePlayPause(): Promise<void> {
    // Cannot toggle while loading
  }

  async seekTo(positionMs: number): Promise<void> {
    console.warn('[AudioPlayer] Seek requested while loading, ignoring for now.')
  }
}

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

export class ErrorState extends AudioPlayerState {
  constructor(context: PlayerService, public readonly error: Error) {
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
