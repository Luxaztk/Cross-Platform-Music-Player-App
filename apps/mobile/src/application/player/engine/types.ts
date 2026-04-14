export type EngineProgress = {
  isLoaded: boolean
  isPlaying: boolean
  positionMs: number
  durationMs: number
}

export type ProgressListener = (p: EngineProgress) => void

export type LoadOptions = {
  shouldPlay?: boolean
}

export type LockScreenMetadata = {
  title?: string
  artist?: string
  albumTitle?: string
  artworkUrl?: string
}

export interface PlayerEngine {
  configure(): Promise<void>
  load(uri: string, opts?: LoadOptions): Promise<void>
  unload(): Promise<void>

  play(): Promise<void>
  pause(): Promise<void>
  togglePlayPause(): Promise<void>

  seekTo(positionMs: number): Promise<void>
  setVolume(volume01: number): Promise<void>

  subscribe(listener: ProgressListener): () => void

  setActiveForLockScreen(active: boolean, metadata?: LockScreenMetadata): Promise<void>
}
