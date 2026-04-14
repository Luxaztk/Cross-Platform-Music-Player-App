import { ExpoAudioEngine } from './engine/ExpoAudioEngine'
import type { EngineProgress, PlayerEngine, ProgressListener } from './engine/types'
import type { LockScreenMetadata } from './engine/types'

export type PlayerProgress = EngineProgress

export class PlayerService {
  constructor(private engine: PlayerEngine = new ExpoAudioEngine()) {}

  subscribe(listener: ProgressListener) {
    return this.engine.subscribe(listener)
  }

  async unload() {
    await this.engine.unload()
  }

  async load(uri: string, opts?: { shouldPlay?: boolean }) {
    await this.engine.load(uri, opts)
  }

  async play() {
    await this.engine.play()
  }

  async pause() {
    await this.engine.pause()
  }

  async togglePlayPause() {
    await this.engine.togglePlayPause()
  }

  async seekTo(positionMs: number) {
    await this.engine.seekTo(positionMs)
  }

  async setVolume(volume01: number) {
    await this.engine.setVolume(volume01)
  }

  async setActiveForLockScreen(active: boolean, metadata?: LockScreenMetadata) {
    await this.engine.setActiveForLockScreen(active, metadata)
  }
}
