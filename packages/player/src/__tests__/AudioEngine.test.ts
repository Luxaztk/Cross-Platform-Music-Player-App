import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { AudioEngine, type AudioEvents } from '../AudioEngine';
import { Howl } from 'howler';

// --- BƯỚC 1: ĐỊNH NGHĨA INTERFACES CHO MOCK ---

interface MockHowlInstance extends Howl {
  _isPlaying: boolean;
  _state: 'unloaded' | 'loading' | 'loaded';
  _seek: number;
  _duration: number;
  _sinkId: string;
  _trigger: (event: string, ...args: unknown[]) => void;
  options: Record<string, unknown>; // Howler options có cấu trúc rất phức tạp, để any ở đây là chấp nhận được hoặc dùng Record<string, unknown>
  _sounds: Array<{ _node: { setSinkId: Mock } }>;
}

let lastHowlInstance: MockHowlInstance | null = null;

// --- BƯỚC 2: MOCK CLASS ---

class MockHowl {
  public options: any;
  public _isPlaying = false;
  public _state: 'unloaded' | 'loading' | 'loaded' = 'loading';
  public _seek = 0;
  public _duration = 180;
  public _sinkId = 'default';
  public _sounds = [{
    _node: {
      setSinkId: vi.fn(async (id: string) => { this._sinkId = id; })
    }
  }];

  constructor(options: any) {
    this.options = options
    // Ép kiểu một lần duy nhất để capture instance phục vụ việc kiểm tra seek/state
    lastHowlInstance = this as unknown as MockHowlInstance;

    if (options.autoplay) {
      this._isPlaying = true;
    }

    setTimeout(() => {
      this._state = 'loaded';
      if (this.options.onload) this.options.onload();
    }, 0);
  }

  load = vi.fn().mockImplementation(function (this: MockHowl) {
    this._state = 'loading';
    setTimeout(() => {
      this._state = 'loaded';
      if (this.options.onload) this.options.onload();
    }, 0);
    return this;
  });

  play = vi.fn().mockImplementation(function (this: MockHowl) {
    this._isPlaying = true;
    setTimeout(() => this._trigger('play'), 0);
    return 1;
  });

  pause = vi.fn().mockImplementation(function (this: MockHowl) {
    this._isPlaying = false;
    setTimeout(() => this._trigger('pause'), 0);
    return this;
  });

  stop = vi.fn().mockImplementation(function (this: MockHowl) {
    this._isPlaying = false;
    setTimeout(() => this._trigger('stop'), 0);
    return this;
  });

  seek = vi.fn().mockImplementation(function (this: MockHowl, val?: number) {
    if (typeof val === 'number') {
      this._seek = val;
      setTimeout(() => this._trigger('seek'), 0);
      return this;
    }
    return this._seek;
  });

  _trigger(event: string, ...args: unknown[]) {
    const handler = this.options[`on${event}`];
    if (handler) handler(...args);
  }

  // Các phương thức còn lại dùng mockImplementation để giữ đúng context
  unload = vi.fn().mockReturnThis();
  duration = vi.fn().mockImplementation(() => this._duration);
  state = vi.fn().mockImplementation(() => this._state);
  playing = vi.fn().mockImplementation(() => this._isPlaying);
  once = vi.fn().mockImplementation(function (this: MockHowl, event, cb) {
    if (event === 'unlock') setTimeout(cb, 0);
    return this;
  });
  on = vi.fn().mockReturnThis();
}

vi.mock('howler', () => {
  let mockHowlerVolume = 1;
  return {
    Howl: vi.fn().mockImplementation((options) => new MockHowl(options)),
    Howler: {
      volume: vi.fn((val?: number) => {
        if (typeof val === 'number') mockHowlerVolume = val;
        return mockHowlerVolume;
      }),
    }
  };
});

describe('AudioEngine', () => {
  let engine: AudioEngine;
  let events: Record<keyof AudioEvents, Mock>;
  let rafSpy: Mock;
  let cafSpy: Mock;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // FIX: Mock rAF với kiểu dữ liệu chuẩn và dọn dẹp trong afterEach
    rafSpy = vi.fn((cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16));
    cafSpy = vi.fn((id: number) => clearTimeout(id));

    vi.stubGlobal('requestAnimationFrame', rafSpy);
    vi.stubGlobal('cancelAnimationFrame', cafSpy);

    lastHowlInstance = null;

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

    engine = new AudioEngine(events as unknown as AudioEvents);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
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

      expect(rafSpy).toHaveBeenCalled();

      const lastRafId = rafSpy.mock.results.slice(-1)[0].value;

      engine.pause();
      vi.runOnlyPendingTimers();
      expect(cafSpy).toHaveBeenCalledWith(lastRafId);
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

  it('should track progress using requestAnimationFrame', async () => {
    engine.load('song.mp3');
    vi.runOnlyPendingTimers();
    engine.play();
    vi.runOnlyPendingTimers();

    if (lastHowlInstance) lastHowlInstance._seek = 10;
    vi.advanceTimersByTime(16);
    expect(events.onProgress).toHaveBeenCalledWith(10, 180);
  });
});