import { Howl, Howler } from 'howler';

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

interface SoundInternal {
  _node?: {
    setSinkId?: (deviceId: string) => Promise<void>;
  };
}

interface HowlInternal extends Howl {
  _sounds?: SoundInternal[];
}

export interface AudioEvents {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onProgress?: (progress: number, duration: number) => void;
  onLoad?: (duration: number) => void;
  onEnd?: () => void;
  onLoadError?: (error: unknown) => void;
  onPlayError?: (error: unknown) => void;
}

export class AudioEngine {
  private howl: Howl | null = null;
  private animationFrameId: number | null = null;
  private events: AudioEngineEvents = {};
  private currentSinkId: string = 'default';
  private pendingSeek: number | null = null;

  constructor(events?: AudioEngineEvents) {
    if (events) {
      this.events = events;
    }
  }

  public setEvents(events: AudioEngineEvents) {
    this.events = events;
  }

  public async setSinkId(deviceId: string) {
    this.currentSinkId = deviceId;
    if (!this.howl) return;

    const sounds = (this.howl as HowlInternal)._sounds;
    if (sounds) {
      for (const sound of sounds) {
        if (sound._node && typeof sound._node.setSinkId === 'function') {
          try {
            await sound._node.setSinkId(deviceId);
          } catch (e) {
            console.error('Failed to set sinkId on node:', e);
          }
        }
      }
    }
  }

  private lastUrl: string | null = null;

  public load(filePath: string, autoplay: boolean = false) {
    this.stop(); // Stop anything currently playing
    this.pendingSeek = null; // Reset pending seek on new load

    // [FIX]: GỌI VÀO ĐƯỜNG CAO TỐC STREAM NHẠC ĐÃ ĐƯỢC CẤP PHÉP CORS
    const url = `melovista://stream/${encodeURIComponent(filePath)}`;
    this.lastUrl = url;

    this.howl = new Howl({
      src: [url],
      html5: true, // Standardized protocol now supports Range requests in HTML5 mode
      autoplay: autoplay,
      format: ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg'],
      onplay: () => {
        if (this.events.onPlay) this.events.onPlay();
        this.startTrackingProgress();
      },
      onpause: () => {
        if (this.events.onPause) this.events.onPause();
        this.stopTrackingProgress();
      },
      onstop: () => {
        if (this.events.onStop) this.events.onStop();
        this.stopTrackingProgress();
      },
      onend: () => {
        if (this.events.onEnd) this.events.onEnd();
        this.stopTrackingProgress();
      },
      onload: () => {
        const duration = this.howl?.duration() || 0;
        if (this.events.onLoad) this.events.onLoad(duration);

        // Apply pending seek if any
        if (this.pendingSeek !== null) {
          const seekTo = this.pendingSeek;
          this.pendingSeek = null;
          this.howl?.seek(seekTo);
        }

        // Apply the sink ID as soon as it loads and nodes are created
        if (this.currentSinkId !== 'default') {
          this.setSinkId(this.currentSinkId);
        }
      },
      onseek: () => {
        this.startTrackingProgress();
      },
      onloaderror: (_id: number, err: unknown) => {
        console.error('Howler load error:', err);
        if (this.events.onLoadError) this.events.onLoadError(err);
      },
      onplayerror: (_id: number, err: unknown) => {
        console.error('Howler play error:', err);
        if (this.events.onPlayError) this.events.onPlayError(err);
        this.howl?.once('unlock', () => {
          this.howl?.play();
        });
      }
    });

    if (autoplay) {
      this.howl.play();
    }
  }

  public play() {
    if (this.howl) {
      if (this.howl.state() === 'unloaded') {
        this.howl.load();
      }
      this.howl.play();
    }
  }

  public state(): 'unloaded' | 'loading' | 'loaded' {
    return this.howl ? this.howl.state() : 'unloaded';
  }

  public getSource(): string | null {
    return this.lastUrl;
  }

  public pause() {
    if (this.howl && this.howl.playing()) {
      this.howl.pause();
    }
  }

  public stop() {
    if (this.howl) {
      this.howl.stop();
      this.howl.unload();
      this.howl = null;
    }
    this.stopTrackingProgress();
  }

  public seek(seconds: number) {
    if (this.howl) {
      if (this.howl.state() === 'loaded') {
        this.howl.seek(seconds);
      } else {
        this.pendingSeek = seconds;
      }
      // Trigger an immediate progress update when seeking
      if (this.events.onProgress) {
        this.events.onProgress(seconds, this.howl.duration());
      }
    }
  }

  public setVolume(volume: number) {
    Howler.volume(volume); // Set global volume
  }

  public getVolume(): number {
    return Howler.volume();
  }

  public isPlaying(): boolean {
    return this.howl ? this.howl.playing() : false;
  }

  public hasSource(): boolean {
    return this.howl !== null;
  }

  private startTrackingProgress() {
    if (this.animationFrameId !== null) return; // Already tracking
    if (!this.howl) return;

    const track = () => {
      if (this.howl && this.howl.playing()) {
        const progress = this.howl.seek() as number;
        const duration = this.howl.duration();
        if (this.events.onProgress) {
          this.events.onProgress(progress, duration);
        }
      }

      // Keep the loop running if we have a sound and it's not explicitly stopped.
      // The onpause/onstop/onend handlers will call stopTrackingProgress to kill this.
      if (this.howl) {
        this.animationFrameId = requestAnimationFrame(track);
      } else {
        this.animationFrameId = null;
      }
    };
    this.animationFrameId = requestAnimationFrame(track);
  }

  private stopTrackingProgress() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
