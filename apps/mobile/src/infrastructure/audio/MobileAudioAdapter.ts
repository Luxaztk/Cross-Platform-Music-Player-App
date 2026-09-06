import { ExpoAudioEngine } from './ExpoAudioEngine';
import type { IAudioEngine, AudioEngineEvents } from '@music/core';
import type { Song } from '@music/types';
import { MobileAudioCacheService } from '../services/MobileAudioCacheService';

function extractSongId(url: string): string {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/api\/stream\/(.+)$/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      return decodeURIComponent(segments[segments.length - 1]);
    }
  } catch {
    // fallback
  }
  return url.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export class MobileAudioAdapter implements IAudioEngine {
  private engine: ExpoAudioEngine;
  private currentUrl: string | null = null;
  private events: AudioEngineEvents = {};
  private currentVolume = 1;
  private lastIsPlaying = false;
  private lastDidJustFinish = false;

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
        if (!this.lastDidJustFinish) {
          this.lastDidJustFinish = true;
          if (this.events.onEnd) {
            this.events.onEnd();
          }
        }
      } else {
        this.lastDidJustFinish = false;
      }
    });
  }

  private activeCommand: Promise<void> = Promise.resolve();

  private queueCommand(command: () => Promise<void>) {
    this.activeCommand = this.activeCommand.then(async () => {
      try {
        await command();
      } catch (err) {
        console.error(err);
      }
    });
  }

  load(filePath: string, autoplay?: boolean, songId?: string): void {
    this.currentUrl = filePath;
    this.queueCommand(async () => {
      try {
        let uriToLoad = filePath;
        const isRemote = /^https?:\/\//i.test(filePath);

        if (isRemote) {
          try {
            const cached = await MobileAudioCacheService.getCachedUri(songId, filePath);
            if (cached) {
              uriToLoad = cached;
            } else {
              const idToCache = songId || extractSongId(filePath);
              // Background fire-and-forget stream caching
              void MobileAudioCacheService.cacheSongStream(idToCache, filePath).catch(() => {});
            }
          } catch {
            // cache service error fallback
          }
        }

        await this.engine.load(uriToLoad, { shouldPlay: autoplay });
        if (this.events.onLoad) {
          this.events.onLoad(0);
        }
      } catch (err) {
        if (this.events.onLoadError) {
          this.events.onLoadError(err);
        }
      }
    });
  }

  play(): void {
    this.queueCommand(async () => {
      try {
        await this.engine.play();
      } catch (err) {
        if (this.events.onPlayError) this.events.onPlayError(err);
      }
    });
  }

  pause(): void {
    this.queueCommand(async () => {
      await this.engine.pause();
    });
  }

  stop(): void {
    this.currentUrl = null;
    this.queueCommand(async () => {
      await this.engine.setActiveForLockScreen(false);
      await this.engine.unload();
      if (this.events.onStop) this.events.onStop();
    });
  }

  updateLockScreen(active: boolean, song?: Song | null): void {
    this.queueCommand(async () => {
      if (!active || !song) {
        await this.engine.setActiveForLockScreen(false);
        return;
      }

      const artistName =
        song.artist ||
        (song.artists && song.artists.length > 0 ? song.artists.join(', ') : 'Unknown Artist');

      await this.engine.setActiveForLockScreen(true, {
        title: song.title || 'Unknown Title',
        artist: artistName,
        albumTitle: song.album || undefined,
        artworkUrl: song.coverArt || undefined,
      });
    });
  }

  seek(seconds: number): void {
    this.queueCommand(async () => {
      await this.engine.seekTo(seconds * 1000);
    });
  }

  setVolume(volume: number): void {
    this.currentVolume = volume;
    this.queueCommand(async () => {
      await this.engine.setVolume(volume);
    });
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
    const isRemote = /^https?:\/\//i.test(this.currentUrl);
    return isRemote ? this.currentUrl : `melovista://app/${encodeURIComponent(this.currentUrl)}`;
  }

  getAnalyser(): AnalyserNode | null {
    return null; // Not supported on mobile
  }

  async waitForIdle(): Promise<void> {
    await this.activeCommand;
  }
}

