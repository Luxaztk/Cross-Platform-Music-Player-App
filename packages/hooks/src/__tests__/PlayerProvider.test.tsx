import React from 'react';
import { render, act, renderHook, waitFor } from '@testing-library/react';
import { PlayerProvider, usePlayer } from '../PlayerProvider';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Song, PlayerState } from '@music/types';
import type { IStorageAdapter } from '@music/core';
import { AudioEngine } from '@music/player';

let lastEngineOptions: any;

// Mock AudioEngine
vi.mock('@music/player', () => {
  return {
    AudioEngine: vi.fn().mockImplementation(function(options) {
      lastEngineOptions = options;
      return {
        load: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        stop: vi.fn(),
        seek: vi.fn(),
        setVolume: vi.fn(),
        setSinkId: vi.fn(),
        state: vi.fn().mockReturnValue('loaded'),
        playing: vi.fn().mockReturnValue(false),
        getSource: vi.fn().mockReturnValue(''),
      };
    })
  };
});

// Mock useAudioDevices
vi.mock('../useAudioDevices', () => ({
  useAudioDevices: vi.fn().mockReturnValue({ currentDeviceId: 'default' })
}));

describe('PlayerProvider', () => {
  let mockStorage: IStorageAdapter;
  const mockSongs: Song[] = [
    { id: '1', title: 'Song 1', artist: 'A1', artists: ['A1'], filePath: 'p1', duration: 100, album: 'Album 1', genre: '', year: 2021, coverArt: null, hash: 'h1', fileSize: 1000 },
    { id: '2', title: 'Song 2', artist: 'A2', artists: ['A2'], filePath: 'p2', duration: 200, album: 'Album 2', genre: '', year: 2021, coverArt: null, hash: 'h2', fileSize: 2000 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Use real timers by default for hydration
    vi.useRealTimers();

    mockStorage = {
      getPlayerState: vi.fn().mockResolvedValue(null),
      savePlayerState: vi.fn().mockResolvedValue(true),
    } as unknown as IStorageAdapter;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PlayerProvider storage={mockStorage} allSongs={mockSongs}>
      {children}
    </PlayerProvider>
  );

  it('should hydrate state from storage on mount', async () => {
    const savedState: PlayerState = {
      currentSongId: '2',
      queueIds: ['1'],
      historyIds: [],
      originalContextIds: ['1', '2'],
      volume: 0.5,
      repeatMode: 'ALL',
      isShuffle: false,
    };
    (mockStorage.getPlayerState as any).mockResolvedValue(savedState);

    const { result } = renderHook(() => usePlayer(), { wrapper });

    // Wait for hydration
    await waitFor(() => {
      expect(result.current.currentSong?.id).toBe('2');
    }, { timeout: 2000 });

    expect(result.current.volume).toBe(0.5);
    expect(result.current.repeatMode).toBe('ALL');
    expect(result.current.queue).toHaveLength(1);
  });

  it('should play song immediately with playNow', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });

    // Wait for first render/hydration
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      result.current.playNow(mockSongs[0]);
    });

    expect(result.current.currentSong?.id).toBe('1');
    const engine = vi.mocked(AudioEngine).mock.results[0].value;
    expect(engine.load).toHaveBeenCalledWith('p1', true);
  });

  it('should handle queue management (add, remove, reorder)', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      result.current.addToQueue(mockSongs[0]);
      result.current.addToQueue(mockSongs[1]);
    });

    expect(result.current.queue).toHaveLength(2);

    await act(async () => {
      result.current.reorderQueue(0, 1);
    });
    expect(result.current.queue[0].song.id).toBe('2');

    await act(async () => {
      result.current.removeFromQueue(0);
    });
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].song.id).toBe('1');
  });

  it('should handle next/prev logic', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      result.current.playList(mockSongs, 0); // Play mockSongs[0], queue mockSongs[1]
    });

    expect(result.current.currentSong?.id).toBe('1');
    expect(result.current.queue).toHaveLength(1);

    await act(async () => {
      result.current.next();
    });

    expect(result.current.currentSong?.id).toBe('2');
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].id).toBe('1');

    await act(async () => {
      result.current.prev();
    });

    expect(result.current.currentSong?.id).toBe('1');
  });

  it('should persist state to storage on changes', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      result.current.setVolume(0.8);
    });

    // persistence is triggered in useEffect
    await waitFor(() => {
      expect(mockStorage.savePlayerState).toHaveBeenCalledWith(expect.objectContaining({
        volume: 0.8
      }));
    });
  });

  it('should shuffle the queue when isShuffle is toggled', async () => {
     const { result } = renderHook(() => usePlayer(), { wrapper });
     await waitFor(() => expect(result.current).not.toBeNull());

     await act(async () => {
       result.current.playList(mockSongs, 0);
     });

     await act(async () => {
       result.current.toggleShuffle();
     });

     expect(result.current.isShuffle).toBe(true);
  });

  it('should handle onEnd event and auto-skip to next', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      result.current.playList(mockSongs, 0);
    });

    expect(result.current.currentSong?.id).toBe('1');

    await act(async () => {
      // Simulate end of song
      if (lastEngineOptions.onEnd) lastEngineOptions.onEnd();
    });

    expect(result.current.currentSong?.id).toBe('2');
  });

  it('should handle repeat ONE mode onEnd', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      result.current.playNow(mockSongs[0]);
      result.current.setRepeatMode('ONE');
    });

    await act(async () => {
      if (lastEngineOptions.onEnd) lastEngineOptions.onEnd();
    });

    // Should stay on song 1
    expect(result.current.currentSong?.id).toBe('1');
    const engine = vi.mocked(AudioEngine).mock.results[0].value;
    expect(engine.seek).toHaveBeenCalledWith(0);
    expect(engine.play).toHaveBeenCalled();
  });

  it('should handle onLoadError by skipping to next song', async () => {
    const savedState: PlayerState = {
      currentSongId: '1',
      queueIds: ['2'],
      historyIds: [],
      originalContextIds: ['1', '2'],
      volume: 0.5,
      repeatMode: 'OFF',
      isShuffle: false,
    };
    (mockStorage.getPlayerState as any).mockResolvedValue(savedState);

    const { result } = renderHook(() => usePlayer(), { wrapper });
    
    // 1. Wait for hydration using real timers
    await waitFor(() => expect(result.current.currentSong?.id).toBe('1'), { timeout: 2000 });

    await act(async () => {
      // AudioEngine should have been loaded with 'p1' due to hydration
    });

    // 2. Switch to fake timers for the skip delay
    vi.useFakeTimers();
    
    await act(async () => {
      if (lastEngineOptions.onLoadError) lastEngineOptions.onLoadError('File not found');
    });

    expect(result.current.currentSong?.id).toBe('1');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // 3. Verify skip happened
    expect(result.current.currentSong?.id).toBe('2');
    
    vi.useRealTimers();
  });

  it('should update progress and duration via engine callbacks', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      if (lastEngineOptions.onProgress) lastEngineOptions.onProgress(10, 100);
    });

    expect(result.current.progress).toBe(10);
    expect(result.current.duration).toBe(100);
  });

  it('should handle onPlayError by skipping', async () => {
    const savedState: PlayerState = {
      currentSongId: '1',
      queueIds: ['2'],
      historyIds: [],
      originalContextIds: ['1', '2'],
      volume: 0.5,
      repeatMode: 'OFF',
      isShuffle: false,
    };
    (mockStorage.getPlayerState as any).mockResolvedValue(savedState);

    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current.currentSong?.id).toBe('1'), { timeout: 2000 });

    vi.useFakeTimers();
    await act(async () => {
      if (lastEngineOptions.onPlayError) lastEngineOptions.onPlayError('Autoplay blocked');
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentSong?.id).toBe('2');
    vi.useRealTimers();
  });

  it('should handle repeat ALL when queue reaches the end', async () => {
    const savedState: PlayerState = {
      currentSongId: '2',
      queueIds: [],
      historyIds: [],
      originalContextIds: ['1', '2'],
      volume: 0.5,
      repeatMode: 'ALL',
      isShuffle: false,
    };
    (mockStorage.getPlayerState as any).mockResolvedValue(savedState);

    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current.currentSong?.id).toBe('2'), { timeout: 2000 });

    expect(result.current.currentSong?.id).toBe('2');

    await act(async () => {
      if (lastEngineOptions.onEnd) lastEngineOptions.onEnd();
    });

    // Should restart from song 1
    expect(result.current.currentSong?.id).toBe('1');
  });

  it('should handle prev within 3s and after 3s', async () => {
    const savedState: PlayerState = {
      currentSongId: '1',
      queueIds: ['2'],
      historyIds: [],
      originalContextIds: ['1', '2'],
      volume: 0.5,
      repeatMode: 'OFF',
      isShuffle: false,
    };
    (mockStorage.getPlayerState as any).mockResolvedValue(savedState);

    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current.currentSong?.id).toBe('1'), { timeout: 2000 });

    const engine = vi.mocked(AudioEngine).mock.results[0].value;

    await act(async () => {
      result.current.next(); // Play 2, history [1]
    });

    expect(result.current.currentSong?.id).toBe('2');

    // Case 1: Seek to 0 if > 3s
    await act(async () => {
      if (lastEngineOptions.onProgress) lastEngineOptions.onProgress(5, 100);
    });

    await act(async () => {
      result.current.prev();
    });

    expect(engine.seek).toHaveBeenCalledWith(0);
    expect(result.current.currentSong?.id).toBe('2'); // Still same song

    // Case 2: Go to history if < 3s
    await act(async () => {
      if (lastEngineOptions.onProgress) lastEngineOptions.onProgress(1, 100);
    });

    await act(async () => {
      result.current.prev();
    });

    expect(result.current.currentSong?.id).toBe('1');
  });

  it('should handle playNext (adding to head of queue)', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      result.current.playNow(mockSongs[0]);
      result.current.playNext(mockSongs[1]);
    });

    expect(result.current.queue[0].song.id).toBe('2');
  });
  it('restore original order when toggleShuffle is turned off', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      result.current.playList(mockSongs, 0); // Org: [1, 2], Queue: [2]
    });

    await act(async () => {
      result.current.toggleShuffle(); // Shuffle ON
    });
    expect(result.current.isShuffle).toBe(true);

    await act(async () => {
      result.current.toggleShuffle(); // Shuffle OFF
    });

    expect(result.current.isShuffle).toBe(false);
    expect(result.current.queue[0].song.id).toBe('2');
  });

  it('should call onFileError when onLoadError or onPlayError occurs', async () => {
    const savedState: PlayerState = {
      currentSongId: '1',
      queueIds: ['2'],
      historyIds: [],
      originalContextIds: ['1', '2'],
      volume: 0.5,
      repeatMode: 'OFF',
      isShuffle: false,
    };
    (mockStorage.getPlayerState as any).mockResolvedValue(savedState);

    const onFileError = vi.fn();
    const { result } = renderHook(() => usePlayer(), { 
      wrapper: ({ children }) => <PlayerProvider storage={mockStorage} allSongs={mockSongs} onFileError={onFileError}>{children}</PlayerProvider> 
    });
    await waitFor(() => expect(result.current.currentSong?.id).toBe('1'), { timeout: 2000 });

    await act(async () => {
      if (lastEngineOptions.onLoadError) lastEngineOptions.onLoadError('Error');
    });
    expect(onFileError).toHaveBeenCalledWith(mockSongs[0]);

    await act(async () => {
      if (lastEngineOptions.onPlayError) lastEngineOptions.onPlayError('Error');
    });
    expect(onFileError).toHaveBeenCalledTimes(2);
  });

  it('should update duration via onLoad callback', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    await act(async () => {
      if (lastEngineOptions.onLoad) lastEngineOptions.onLoad(150);
    });

    expect(result.current.duration).toBe(150);
  });

  it('should handle play/pause/seek engine interactions', async () => {
    const savedState: PlayerState = {
      currentSongId: '1',
      queueIds: ['2'],
      historyIds: [],
      originalContextIds: ['1', '2'],
      volume: 0.5,
      repeatMode: 'OFF',
      isShuffle: false,
    };
    (mockStorage.getPlayerState as any).mockResolvedValue(savedState);

    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current.currentSong?.id).toBe('1'), { timeout: 2000 });

    const engine = vi.mocked(AudioEngine).mock.results[0].value;
    
    // Test pause
    await act(async () => { result.current.pause(); });
    expect(engine.pause).toHaveBeenCalled();

    // Test play when already loaded
    engine.state.mockReturnValue('loaded');
    engine.getSource.mockReturnValue(`melovista://app/${encodeURIComponent(mockSongs[0].filePath)}`);
    await act(async () => { result.current.play(); });
    expect(engine.play).toHaveBeenCalled();

    // Test seek when not matched
    engine.getSource.mockReturnValue('wrong-src');
    await act(async () => { result.current.seek(50); });
    expect(engine.load).toHaveBeenCalled();
    expect(engine.seek).toHaveBeenCalledWith(50);
  });

  it('should skip hydration when allSongs or storage is missing', async () => {
    const { result } = renderHook(() => usePlayer(), { 
      wrapper: ({ children }) => <PlayerProvider allSongs={[]}>{children}</PlayerProvider> 
    });
    // Should be hydrated immediately if songs are empty
    expect(result.current).not.toBeNull();
  });

  it('should handle hydration errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (mockStorage.getPlayerState as any).mockRejectedValue(new Error('DB Error'));
    
    const { result } = renderHook(() => usePlayer(), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(consoleSpy).toHaveBeenCalledWith('Failed to hydrate player state:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should throw error when usePlayer is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => usePlayer())).toThrow('usePlayer must be used within a PlayerProvider');
    spy.mockRestore();
  });
});
