export interface AudioEngineEvents {
  onProgress?: (progress: number, duration: number) => void;
  onEnd?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onLoad?: (duration: number) => void;
  onLoadError?: (error: unknown) => void;
  onPlayError?: (error: unknown) => void;
}

export interface IAudioEngine {
  load(filePath: string, autoplay?: boolean): void;
  play(): void;
  pause(): void;
  stop(): void;
  seek(seconds: number): void;
  setVolume(volume: number): void;
  getVolume(): number;
  isPlaying(): boolean;
  state(): 'unloaded' | 'loading' | 'loaded';
  getSource(): string | null;
  getAnalyser(): AnalyserNode | null;
  setEvents(events: AudioEngineEvents): void;
  setSinkId?(deviceId: string): Promise<void>;
}
