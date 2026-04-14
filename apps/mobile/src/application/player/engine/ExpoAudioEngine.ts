import { createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import type { AudioStatus } from 'expo-audio'
import Constants, { ExecutionEnvironment } from 'expo-constants'

import { File } from 'expo-file-system'

import type {
  EngineProgress,
  LoadOptions,
  LockScreenMetadata,
  PlayerEngine,
  ProgressListener,
} from './types'

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function toMessage(err: unknown) {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message
    if (typeof msg === 'string') return msg
  }
  return String(err)
}

export class ExpoAudioEngine implements PlayerEngine {
  private player: ReturnType<typeof createAudioPlayer> | null = null
  private listeners = new Set<ProgressListener>()

  private emit(p: EngineProgress) {
    for (const l of this.listeners) l(p)
  }

  private onStatus = (status: AudioStatus) => {
    this.emit({
      isLoaded: status.isLoaded,
      isPlaying: !!status.playing,
      positionMs: Math.floor((status.currentTime ?? 0) * 1000),
      durationMs: Math.floor((status.duration ?? 0) * 1000),
    })
  }

  async configure() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      })
    } catch (err: unknown) {
      const message = toMessage(err)
      if (message.includes('requireNativeModule')) {
        throw new Error('AUDIO_MODULE_UNAVAILABLE')
      }
      throw err
    }
  }

  subscribe(listener: ProgressListener) {
    this.listeners.add(listener)

    // emit current snapshot immediately for UI
    if (this.player) {
      this.emit({
        isLoaded: this.player.isLoaded,
        isPlaying: this.player.playing,
        positionMs: Math.floor((this.player.currentTime ?? 0) * 1000),
        durationMs: Math.floor((this.player.duration ?? 0) * 1000),
      })
    }

    return () => this.listeners.delete(listener)
  }

  async unload() {
    if (!this.player) return
    const p = this.player
    this.player = null
    try {
      // Remove player from memory (expo-audio API)
      p.remove()
    } finally {
      this.emit({ isLoaded: false, isPlaying: false, positionMs: 0, durationMs: 0 })
    }
  }

  async load(uri: string, opts?: { shouldPlay?: boolean }) {
    await this.configure()

    const file = new File(uri)
    const exists = file.exists || file.info().exists
    
    console.log(`[engine] Loading audio: ${uri}`)
    console.log(`[engine] File exists (property/info): ${file.exists}/${file.info().exists}`)
    if (file.exists) {
      console.log(`[engine] File size: ${file.size} bytes`)
    }

    if (!exists) {
      console.error(`[engine] File not found: ${uri}`)
      throw new Error('FILE_NOT_FOUND')
    }

    if (!this.player) {
      this.player = createAudioPlayer({ uri }, { updateInterval: 250 })
      this.player.addListener('playbackStatusUpdate', this.onStatus)
    } else {
      this.player.replace({ uri })
    }

    this.player.volume = clamp01(this.player.volume ?? 1)

    if (opts?.shouldPlay) {
      this.player.play()
    } else {
      this.player.pause()
    }
  }

  async play() {
    this.player?.play()
  }

  async pause() {
    this.player?.pause()
  }

  async togglePlayPause() {
    if (!this.player) return
    if (this.player.playing) {
      this.player.pause()
    } else {
      this.player.play()
    }
  }

  async seekTo(positionMs: number) {
    if (!this.player) return
    await this.player.seekTo(Math.max(0, positionMs) / 1000)
  }

  async setVolume(volume01: number) {
    if (!this.player) return
    this.player.volume = clamp01(volume01)
  }

  async setActiveForLockScreen(active: boolean, metadata?: LockScreenMetadata) {
    if (!this.player || isExpoGo) return
    this.player.setActiveForLockScreen(active, metadata)
  }
}
