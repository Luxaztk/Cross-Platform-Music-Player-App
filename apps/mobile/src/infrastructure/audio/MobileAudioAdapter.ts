import { ExpoAudioEngine } from './ExpoAudioEngine';
import type { IAudioEngine, AudioEngineEvents } from '@music/core';

export class MobileAudioAdapter implements IAudioEngine {
  private engine: ExpoAudioEngine;
  private currentUrl: string | null = null;
  private events: AudioEngineEvents = {};
  private currentVolume = 1;
  private lastIsPlaying = false;

  constructor() {
    this.engine = new ExpoAudioEngine();
  }

  setEvents(events: AudioEngineEvents): void {
    this.events = events;
    this.engine.subscribe((p) => {
      if (this.events.onProgress) {
        // IAudioEngine expects seconds
        this.events.onProgress(p.positionMs / 1000, p.durationMs / 1000);
      }

      // Sync play/pause state dynamically
      if (p.isPlaying !== this.lastIsPlaying) {
        this.lastIsPlaying = p.isPlaying;
        if (p.isPlaying) {
          if (this.events.onPlay) this.events.onPlay();
        } else {
          if (this.events.onPause) this.events.onPause();
        }
      }
      
      if (p.isLoaded && p.didJustFinish) {
        if (this.events.onEnd) {
          this.events.onEnd();
        }
      }
    });
  }

  load(filePath: string, autoplay?: boolean): void {
    this.currentUrl = filePath;
    this.engine.load(filePath, { shouldPlay: autoplay })
      .then(() => {
        // Since load is async, we simulate onLoad after it completes
        if (this.events.onLoad) {
          this.events.onLoad(0);
        }
      })
      .catch((err) => {
        if (this.events.onLoadError) {
          this.events.onLoadError(err);
        }
      });
  }

  play(): void {
    this.engine.play().catch(err => {
      if (this.events.onPlayError) this.events.onPlayError(err);
    });
  }

  pause(): void {
    this.engine.pause().catch(err => console.error(err));
  }

  stop(): void {
    this.engine.unload().catch(err => console.error(err));
    this.currentUrl = null;
    if (this.events.onStop) this.events.onStop();
  }

  seek(seconds: number): void {
    this.engine.seekTo(seconds * 1000).catch(err => console.error(err));
  }

  setVolume(volume: number): void {
    this.currentVolume = volume;
    this.engine.setVolume(volume).catch(err => console.error(err));
  }

  getVolume(): number {
    return this.currentVolume;
  }

  isPlaying(): boolean {
    return false; // Not heavily used synchronously outside engine
  }

  state(): 'unloaded' | 'loading' | 'loaded' {
    return this.currentUrl ? 'loaded' : 'unloaded';
  }

  getSource(): string | null {
    if (!this.currentUrl) return null;
    return `melovista://app/${encodeURIComponent(this.currentUrl)}`;
  }

  getAnalyser(): AnalyserNode | null {
    return null; // Not supported on mobile
  }
}
