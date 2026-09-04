import { Howl, Howler } from 'howler';
import type { IAudioEngine, AudioEngineEvents } from '@music/core';

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

export class AudioEngine implements IAudioEngine {
  private howl: Howl | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private events: AudioEngineEvents = {};
  private currentSinkId: string = 'default';
  private pendingSeek: number | null = null;
  private isPendingPlay: boolean = false;

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
    
    // Web Audio API approach (Standard for modern browsers)
    // This affects ALL sounds playing through the Howler global context
    if (typeof window !== 'undefined' && Howler.ctx && typeof (Howler.ctx as unknown as { setSinkId: unknown }).setSinkId === 'function') {
      try {
        await (Howler.ctx as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(deviceId === 'default' ? '' : deviceId);
      } catch (e) {
        console.error('Failed to set sinkId on Howler.ctx:', e);
      }
    }

    // HTML5 Audio approach (Fallback or for specific node control)
    if (this.howl) {
      const sounds = (this.howl as HowlInternal)._sounds;
      if (sounds) {
        for (const sound of sounds) {
          if (sound._node && typeof sound._node.setSinkId === 'function') {
            try {
              await sound._node.setSinkId(deviceId === 'default' ? '' : deviceId);
            } catch (e) {
              console.error('Failed to set sinkId on HTML5 node:', e);
            }
          }
        }
      }
    }
  }

  private lastUrl: string | null = null;

  public load(filePath: string, autoplay: boolean = false) {
    // EXPLICIT WAKE-UP: Force Howler's getter to synchronously initialize the AudioContext.
    // This prevents race conditions where the UI's Peak Meter requests the Analyser too early.
    if (typeof window !== 'undefined' && !Howler.ctx) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      Howler.ctx; 
    }

    this.stop(); // Stop anything currently playing
    this.pendingSeek = null; // Reset pending seek on new load
    this.isPendingPlay = autoplay;

    // Check if path is already a remote URL (HTTP/HTTPS/Blob) or a custom protocol
    const isRemote = /^https?:\/\/|^blob:/i.test(filePath);
    const url = isRemote ? filePath : (filePath.startsWith('melovista://') ? filePath : `melovista://app/${encodeURIComponent(filePath)}`);
    this.lastUrl = url;

    this.howl = new Howl({
      src: [url],
      html5: true, // Use HTML5 Audio for INSTANT streaming playback (zero delay)
      autoplay: autoplay,
      format: ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg'],
      onplay: () => {
        this.isPendingPlay = false;

        // Ensure CORS is set on HTMLMediaElement for Web Audio Analyser
        if (isRemote && this.howl) {
          const sounds = (this.howl as HowlInternal)._sounds;
          if (sounds && sounds[0]?._node && 'crossOrigin' in sounds[0]._node) {
            try {
              (sounds[0]._node as HTMLMediaElement).crossOrigin = 'anonymous';
            } catch {
              // Ignore if crossOrigin cannot be set dynamically
            }
          }
        }
        // AGGRESSIVE RESUME: Defeat Autoplay Policy Suspensions
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
          Howler.ctx.resume().then(() => {
            console.log('AudioContext forced to resume!');
          }).catch(err => console.error('Failed to resume context:', err));
        }

        if (this.events.onPlay) this.events.onPlay();
        this.startTrackingProgress();
      },
      onpause: () => {
        this.isPendingPlay = false;
        if (this.events.onPause) this.events.onPause();
        this.stopTrackingProgress();
      },
      onstop: () => {
        this.isPendingPlay = false;
        if (this.events.onStop) this.events.onStop();
        this.stopTrackingProgress();
      },
      onend: () => {
        this.isPendingPlay = false;
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
        this.isPendingPlay = false;
        console.error('Howler load error:', err);
        if (this.events.onLoadError) this.events.onLoadError(err);
      },
      onplayerror: (_id: number, err: unknown) => {
        this.isPendingPlay = false;
        console.error('Howler play error:', err);
        if (this.events.onPlayError) this.events.onPlayError(err);
        this.howl?.once('unlock', () => {
          this.howl?.play();
        });
      }
    });

    // NOTE: We deliberately do NOT call this.howl.play() here.
    // When autoplay is true, Howler's constructor automatically queues playback upon load.
  }

  public play() {
    if (this.howl) {
      // Monophonic Guard: Do not call play if already playing or pending autoplay
      if (this.howl.playing() || this.isPendingPlay) {
        return;
      }
      if (this.howl.state() === 'unloaded') {
        this.howl.load();
      }
      this.isPendingPlay = true;
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
    this.isPendingPlay = false;
    if (this.howl && this.howl.playing()) {
      this.howl.pause();
    }
  }

  public stop() {
    this.isPendingPlay = false;
    if (this.howl) {
      // Physical node cleanup: forcibly pause and disconnect underlying HTML5 audio nodes
      // to guarantee no zombie audio streams continue running in Chromium.
      const sounds = (this.howl as HowlInternal)._sounds;
      if (sounds) {
        for (const sound of sounds) {
          const node = sound._node as unknown as HTMLMediaElement | undefined;
          if (node && typeof node.pause === 'function') {
            try {
              node.pause();
              node.src = '';
            } catch {
              // Ignore
            }
          }
        }
      }
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
        const progress = this.pendingSeek !== null ? this.pendingSeek : (this.howl.seek() as number);
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

  public getAnalyser(): AnalyserNode | null {
    if (!Howler.ctx) return null;

    // Create analyser if it doesn't exist
    if (!this.analyser) {
      try {
        this.analyser = Howler.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.4;
      } catch (e) {
        console.error('Failed to create AnalyserNode:', e);
        return null;
      }
    }

    // Check if we are using HTML5 Audio node
    const sounds = (this.howl as HowlInternal)?._sounds;
    const audioNode = sounds && sounds.length > 0 ? sounds[0]._node : null;

    if (audioNode instanceof HTMLMediaElement) {
      try {
        const nodeWithSource = audioNode as HTMLMediaElement & { _sourceNode?: MediaElementAudioSourceNode };
        if (!nodeWithSource._sourceNode) {
          nodeWithSource._sourceNode = Howler.ctx.createMediaElementSource(audioNode);
        }
        
        // Connect HTML5 Source -> Analyser -> Howler.masterGain
        if (Howler.masterGain) {
          nodeWithSource._sourceNode.disconnect();
          nodeWithSource._sourceNode.connect(this.analyser);
          this.analyser.disconnect();
          this.analyser.connect(Howler.masterGain);
        }
        return this.analyser;
      } catch (e) {
        console.warn('Failed to route HTML5 audio to analyser:', e);
      }
    }

    // Fallback: Web Audio API mode routing (html5: false)
    if (Howler.masterGain && this.analyser) {
      try {
        // Disconnect first to prevent memory leaks/infinite routing loops
        this.analyser.disconnect(); 
        Howler.masterGain.connect(this.analyser);
      } catch (e) {
        console.warn('Silent routing error:', e);
      }
      return this.analyser;
    }

    return null;
  }
}
