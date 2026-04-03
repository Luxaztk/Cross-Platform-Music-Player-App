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

export class AudioEngine {
  private howl: Howl | null = null;
  private animationFrameId: number | null = null;
  private events: AudioEngineEvents = {};
  
  constructor(events?: AudioEngineEvents) {
    if (events) {
      this.events = events;
    }
  }

  public setEvents(events: AudioEngineEvents) {
    this.events = events;
  }

  public load(filePath: string, autoplay: boolean = false) {
    this.stop(); // Stop anything currently playing

    // Convert file path to custom protocol
    const url = `melovista://${encodeURIComponent(filePath)}`;

    this.howl = new Howl({
      src: [url],
      html5: true, // Force HTML5 Web Audio for large files to avoid loading entire file into memory
      autoplay: autoplay,
      format: ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg'],
      onload: () => {
        if (this.events.onLoad && this.howl) {
          this.events.onLoad(this.howl.duration());
        }
      },
      onplay: () => {
        if (this.events.onPlay) this.events.onPlay();
        this.startTrackingProgress();
      },
      onpause: () => {
        if (this.events.onPause) this.events.onPause();
        this.stopTrackingProgress();
      },
      onend: () => {
        if (this.events.onEnd) this.events.onEnd();
        this.stopTrackingProgress();
      },
      onstop: () => {
        if (this.events.onStop) this.events.onStop();
        this.stopTrackingProgress();
      },
      onloaderror: (_id: number, err: unknown) => {
        if (this.events.onLoadError) this.events.onLoadError(err);
      },
      onplayerror: (_id: number, err: unknown) => {
        if (this.events.onPlayError) this.events.onPlayError(err);
        this.howl?.once('unlock', () => {
          this.howl?.play();
        });
      }
    });
  }

  public play() {
    if (this.howl && !this.howl.playing()) {
      this.howl.play();
    }
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
      this.howl.seek(seconds);
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

  private startTrackingProgress() {
    if (this.animationFrameId !== null) return; // Already tracking

    const track = () => {
      if (this.howl && this.howl.playing()) {
        const progress = this.howl.seek() as number;
        const duration = this.howl.duration();
        if (this.events.onProgress) {
          this.events.onProgress(progress, duration);
        }
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
