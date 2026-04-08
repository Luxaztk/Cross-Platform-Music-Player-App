import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioEngine } from '../AudioEngine';

// --- Mocking Infrastructure ---

let mockHowlerVolume = 1;
let lastHowlInstance: MockHowl | null = null;

class MockHowl {
  public options: any;
  public _isPlaying = false;
  public _state: 'unloaded' | 'loading' | 'loaded' = 'loading'; // Start as loading
  public _seek = 0;
  public _duration = 180;
  public _sinkId = 'default';

  constructor(options: any) {
    this.options = options;
    lastHowlInstance = this;
    if (options.autoplay) {
      this._isPlaying = true;
    }
    // Simulate async load
    setTimeout(() => {
      this._state = 'loaded';
      if (this.options.onload) this.options.onload();
    }, 0);
  }

  load = vi.fn(() => {
    this._state = 'loading';
    setTimeout(() => {
      this._state = 'loaded';
      if (this.options.onload) this.options.onload();
    }, 0);
    return this;
  });

  play = vi.fn(() => { 
    this._isPlaying = true; 
    setTimeout(() => this._trigger('play'), 0);
    return 1;
  });
  pause = vi.fn(() => { 
    this._isPlaying = false; 
    setTimeout(() => this._trigger('pause'), 0);
    return this; 
  });
  stop = vi.fn(() => { 
    this._isPlaying = false; 
    setTimeout(() => this._trigger('stop'), 0);
    return this; 
  });
  unload = vi.fn(() => { 
    this._state = 'unloaded'; 
    return this; 
  });
  seek = vi.fn((val?: number) => { 
    if (typeof val === 'number') {
      this._seek = val;
      setTimeout(() => this._trigger('seek'), 0);
      return this;
    }
    return this._seek;
  });
  duration = vi.fn(() => this._duration);
  state = vi.fn(() => this._state);
  playing = vi.fn(() => this._isPlaying);
  once = vi.fn((event, cb) => {
    if (event === 'unlock') setTimeout(cb, 0);
    return this;
  });
  on = vi.fn();

  // Helper to simulate events from Howler
  _trigger(event: string, ...args: any[]) {
    const handler = this.options[`on${event}`];
    if (handler) handler(...args);
  }

  // SinkId mock
  _sounds = [{
    _node: {
      setSinkId: vi.fn(async (id: string) => { this._sinkId = id; })
    }
  }];
}

vi.mock('howler', () => {
  return {
    Howl: vi.fn().mockImplementation(function (options) {
      return new MockHowl(options);
    }),
    Howler: {
      volume: vi.fn((val?: number) => {
        if (typeof val === 'number') mockHowlerVolume = val;
        return mockHowlerVolume;
      }),
    }
  };
});

// Mock requestAnimationFrame using Vitest's fake timers
let mockRaf: any;
let mockCaf: any;

describe('AudioEngine', () => {
  let engine: AudioEngine;
  let events: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    
    // Setup global mocks
    mockRaf = vi.fn((cb) => setTimeout(() => cb(Date.now()), 16));
    mockCaf = vi.fn((id) => clearTimeout(id));
    vi.stubGlobal('requestAnimationFrame', mockRaf);
    vi.stubGlobal('cancelAnimationFrame', mockCaf);
    
    lastHowlInstance = null;
    mockHowlerVolume = 1;

    events = {
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onStop: vi.fn(),
      onProgress: vi.fn(),
      onLoad: vi.fn(),
      onEnd: vi.fn(),
      onLoadError: vi.fn(),
      onPlayError: vi.fn(),
    };
    engine = new AudioEngine(events);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Core Functionality', () => {
    it('should load a song and setup Howl correctly', async () => {
      engine.load('test.mp3');
      expect(engine.hasSource()).toBe(true);
      expect(lastHowlInstance).toBeDefined();

      vi.runOnlyPendingTimers(); // Trigger onload
      expect(events.onLoad).toHaveBeenCalledWith(180);
    });

    it('should handle play/pause/stop lifecycle', async () => {
      engine.load('test.mp3');
      vi.runOnlyPendingTimers();

      engine.play();
      vi.runOnlyPendingTimers();
      expect(events.onPlay).toHaveBeenCalled();
      expect(engine.isPlaying()).toBe(true);

      engine.pause();
      vi.runOnlyPendingTimers();
      expect(events.onPause).toHaveBeenCalled();
      expect(engine.isPlaying()).toBe(false);

      engine.stop();
      vi.runOnlyPendingTimers();
      expect(events.onStop).toHaveBeenCalled();
      expect(engine.hasSource()).toBe(false);
    });

    it('should return the correct state and source', () => {
      expect(engine.state()).toBe('unloaded');
      engine.load('path/to/song.mp3');
      vi.runOnlyPendingTimers(); // Transition to loaded
      expect(engine.getSource()).toContain('path%2Fto%2Fsong.mp3');
      expect(engine.state()).toBe('loaded');
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress using requestAnimationFrame', async () => {
      engine.load('song.mp3');
      vi.runOnlyPendingTimers(); // onload
      
      engine.play();
      vi.runOnlyPendingTimers(); // onplay
      
      // Move forward in time (3 animation frames)
      if (lastHowlInstance) lastHowlInstance._seek = 10;
      vi.advanceTimersByTime(16);
      expect(events.onProgress).toHaveBeenCalledWith(10, 180);

      if (lastHowlInstance) lastHowlInstance._seek = 11;
      vi.advanceTimersByTime(16);
      expect(events.onProgress).toHaveBeenCalledWith(11, 180);
    });

    it('should stop tracking progress when paused or stopped', () => {
      engine.load('song.mp3');
      vi.runOnlyPendingTimers();
      engine.play();
      vi.runOnlyPendingTimers();
      
      expect(mockRaf).toHaveBeenCalled();
      
      const lastRafId = mockRaf.mock.results.slice(-1)[0].value;
      
      engine.pause();
      vi.runOnlyPendingTimers();
      expect(mockCaf).toHaveBeenCalledWith(lastRafId);
    });
  });

  describe('Advanced Logic', () => {
    it('should handle seeking correctly', () => {
      engine.load('song.mp3');
      vi.runOnlyPendingTimers();
      
      engine.seek(45);
      expect(lastHowlInstance?.seek).toHaveBeenCalledWith(45);
      expect(events.onProgress).toHaveBeenCalledWith(45, 180);
    });

    it('should handle pending seek if called before load', () => {
      engine.load('song.mp3');
      engine.seek(90); // Called while loading
      
      expect(lastHowlInstance?.seek).not.toHaveBeenCalledWith(90);
      
      vi.runOnlyPendingTimers(); // Trigger onload
      expect(lastHowlInstance?.seek).toHaveBeenCalledWith(90);
    });

    it('should update sinkId (audio output device)', async () => {
      await engine.setSinkId('speakers-123');
      engine.load('song.mp3');
      vi.runOnlyPendingTimers();
      
      const node = lastHowlInstance?._sounds[0]._node;
      expect(node?.setSinkId).toHaveBeenCalledWith('speakers-123');
    });

    it('should handle events: onEnd and Errors', () => {
      engine.load('song.mp3');
      vi.runOnlyPendingTimers();
      
      lastHowlInstance?._trigger('end');
      expect(events.onEnd).toHaveBeenCalled();

      lastHowlInstance?._trigger('loaderror', 0, 'Network Error');
      expect(events.onLoadError).toHaveBeenCalledWith('Network Error');

      lastHowlInstance?._trigger('playerror', 0, 'Audio Blocked');
      expect(events.onPlayError).toHaveBeenCalledWith('Audio Blocked');
    });

    it('should update global volume', () => {
      engine.setVolume(0.75);
      expect(engine.getVolume()).toBe(0.75);
    });
  });

  it('should reload the sound if play is called in unloaded state', () => {
    engine.load('song.mp3');
    vi.runOnlyPendingTimers();
    
    if (lastHowlInstance) lastHowlInstance._state = 'unloaded';
    engine.play();
    
    expect(lastHowlInstance?.load).toHaveBeenCalled();
  });
});
