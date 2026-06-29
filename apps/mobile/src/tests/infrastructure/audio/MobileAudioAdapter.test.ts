import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MobileAudioAdapter } from '../../../infrastructure/audio/MobileAudioAdapter';
import { ExpoAudioEngine } from '../../../infrastructure/audio/ExpoAudioEngine';

vi.mock('../../../infrastructure/audio/ExpoAudioEngine', () => {
  return {
    ExpoAudioEngine: vi.fn().mockImplementation(function (this: any) {
      this.subscribe = vi.fn();
      this.load = vi.fn().mockResolvedValue(undefined);
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn().mockResolvedValue(undefined);
      this.unload = vi.fn().mockResolvedValue(undefined);
      this.seekTo = vi.fn().mockResolvedValue(undefined);
      this.setVolume = vi.fn().mockResolvedValue(undefined);
      return this;
    })
  };
});

describe('MobileAudioAdapter', () => {
  let adapter: MobileAudioAdapter;
  let mockEngine: any;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new MobileAudioAdapter();
    // Retrieve the mocked instance
    mockEngine = vi.mocked(ExpoAudioEngine).mock.results[0].value;
  });

  it('initializes and subscribes to engine events', () => {
    const onEnd = vi.fn();
    const onProgress = vi.fn();
    adapter.setEvents({ onEnd, onProgress });
    
    expect(mockEngine.subscribe).toHaveBeenCalled();
    const subscribeCallback = mockEngine.subscribe.mock.calls[0][0];

    // Simulate progress event
    subscribeCallback({ isLoaded: true, didJustFinish: true, positionMs: 1500, durationMs: 3000 });
    
    expect(onEnd).toHaveBeenCalled();
    // MobileAudioAdapter converts ms to seconds for IAudioEngine
    expect(onProgress).toHaveBeenCalledWith(1.5, 3);
  });

  it('loads audio and triggers onLoad', async () => {
    const onLoad = vi.fn();
    adapter.setEvents({ onLoad });
    
    adapter.load('file://test.mp3', true);
    expect(mockEngine.load).toHaveBeenCalledWith('file://test.mp3', { shouldPlay: true });
    
    // Wait for promise resolution
    await new Promise(process.nextTick);
    expect(onLoad).toHaveBeenCalledWith(0);
    expect(adapter.state()).toBe('loaded');
    expect(adapter.getSource()).toBe('melovista://app/file%3A%2F%2Ftest.mp3');
  });

  it('delegates playback controls to engine', () => {
    adapter.play();
    expect(mockEngine.play).toHaveBeenCalled();

    adapter.pause();
    expect(mockEngine.pause).toHaveBeenCalled();

    adapter.stop();
    expect(mockEngine.unload).toHaveBeenCalled();
    expect(adapter.state()).toBe('unloaded');

    adapter.seek(1.5);
    expect(mockEngine.seekTo).toHaveBeenCalledWith(1500);

    adapter.setVolume(0.5);
    expect(mockEngine.setVolume).toHaveBeenCalledWith(0.5);
    expect(adapter.getVolume()).toBe(0.5);
  });
});
