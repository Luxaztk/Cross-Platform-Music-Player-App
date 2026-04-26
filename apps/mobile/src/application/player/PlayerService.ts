import { ExpoAudioEngine } from './engine/ExpoAudioEngine'
import type { EngineProgress, PlayerEngine, ProgressListener } from './engine/types'
import type { LockScreenMetadata } from './engine/types'
import { AudioPlayerState } from './states/AudioPlayerState'
import { IdleState } from './states/IdleState'
import { PlayingState } from './states/PlayingState'
import { PausedState } from './states/PausedState'

export type PlayerProgress = EngineProgress

export class PlayerService {
  private currentState: AudioPlayerState

  constructor(private engine: PlayerEngine = new ExpoAudioEngine()) {
    this.currentState = new IdleState(this)

    // Listen to engine progress to keep internal state synced with external changes
    this.engine.subscribe((progress) => {
      // If we are playing but engine says paused (e.g. OS pause, track end)
      if (!progress.isPlaying && this.currentState instanceof PlayingState) {
        this.setState(new PausedState(this))
      }
      // If we are paused but engine says playing
      else if (progress.isPlaying && this.currentState instanceof PausedState) {
        this.setState(new PlayingState(this))
      }
    })
  }

  setState(state: AudioPlayerState) {
    console.log(`[PlayerService] State transition: ${this.currentState?.getName()} -> ${state.getName()}`)
    this.currentState = state
  }

  getEngine(): PlayerEngine {
    return this.engine
  }

  subscribe(listener: ProgressListener) {
    return this.engine.subscribe(listener)
  }

  async unload() {
    await this.engine.unload()
    this.setState(new IdleState(this))
  }

  async load(uri: string, opts?: { shouldPlay?: boolean }) {
    await this.currentState.load(uri, opts)
  }

  async play() {
    await this.currentState.play()
  }

  async pause() {
    await this.currentState.pause()
  }

  async togglePlayPause() {
    await this.currentState.togglePlayPause()
  }

  async seekTo(positionMs: number) {
    await this.currentState.seekTo(positionMs)
  }

  async setVolume(volume01: number) {
    await this.engine.setVolume(volume01)
  }

  async setActiveForLockScreen(active: boolean, metadata?: LockScreenMetadata) {
    await this.engine.setActiveForLockScreen(active, metadata)
  }
}
