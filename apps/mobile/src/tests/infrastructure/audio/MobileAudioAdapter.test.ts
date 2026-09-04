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
    await adapter.waitForIdle();
    expect(mockEngine.load).toHaveBeenCalledWith('file://test.mp3', { shouldPlay: true });
    
    expect(onLoad).toHaveBeenCalledWith(0);
    expect(adapter.state()).toBe('loaded');
    expect(adapter.getSource()).toBe('melovista://app/file%3A%2F%2Ftest.mp3');
  });

  it('delegates playback controls to engine', async () => {
    adapter.play();
    await adapter.waitForIdle();
    expect(mockEngine.play).toHaveBeenCalled();

    adapter.pause();
    await adapter.waitForIdle();
    expect(mockEngine.pause).toHaveBeenCalled();

    adapter.stop();
    await adapter.waitForIdle();
    expect(mockEngine.unload).toHaveBeenCalled();
    expect(adapter.state()).toBe('unloaded');

    adapter.seek(1.5);
    await adapter.waitForIdle();
    expect(mockEngine.seekTo).toHaveBeenCalledWith(1500);

    adapter.setVolume(0.5);
    await adapter.waitForIdle();
    expect(mockEngine.setVolume).toHaveBeenCalledWith(0.5);
    expect(adapter.getVolume()).toBe(0.5);
  });

  it('handles remote streaming URLs correctly in getSource', async () => {
    adapter.load('http://192.168.1.185:4545/api/stream/song-123', true);
    await adapter.waitForIdle();
    expect(mockEngine.load).toHaveBeenCalledWith('http://192.168.1.185:4545/api/stream/song-123', { shouldPlay: true });
    expect(adapter.getSource()).toBe('http://192.168.1.185:4545/api/stream/song-123');
  });

  it('loads local cached URI if remote stream is already cached', async () => {
    const { MobileAudioCacheService } = await import('../../../infrastructure/services/MobileAudioCacheService');
    vi.spyOn(MobileAudioCacheService, 'getCachedUri').mockResolvedValue('mock-cache-path/melovista/audio_cache/song_123.mp3');

    adapter.load('http://192.168.1.185:4545/api/stream/song-123', true, 'song-123');
    await adapter.waitForIdle();

    expect(mockEngine.load).toHaveBeenCalledWith('mock-cache-path/melovista/audio_cache/song_123.mp3', { shouldPlay: true });
    expect(adapter.getSource()).toBe('http://192.168.1.185:4545/api/stream/song-123');
  });
});
