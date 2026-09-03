import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMediaSession } from '@music/hooks';
import type { Song } from '@music/types';

describe('useMediaSession', () => {
  let originalMediaSession: unknown;
  let originalMediaMetadata: unknown;
  let mockActionHandlers: Record<string, ((details?: unknown) => void) | null>;
  let mockMediaSession: {
    setActionHandler: ReturnType<typeof vi.fn>;
    setPositionState: ReturnType<typeof vi.fn>;
    metadata: unknown;
    playbackState: string;
  };

  const sampleSong: Song = {
    id: 'song-1',
    filePath: '/music/song1.mp3',
    title: 'Test Song',
    artist: 'Test Artist',
    artists: ['Test Artist'],
    album: 'Test Album',
    duration: 180,
    genre: 'Pop',
    year: 2024,
    coverArt: 'data:image/jpeg;base64,mockCoverArt',
  };

  beforeEach(() => {
    originalMediaSession = (navigator as unknown as { mediaSession?: unknown }).mediaSession;
    originalMediaMetadata = (globalThis as unknown as { MediaMetadata?: unknown }).MediaMetadata;

    mockActionHandlers = {};
    mockMediaSession = {
      setActionHandler: vi.fn((action: string, handler: ((details?: unknown) => void) | null) => {
        mockActionHandlers[action] = handler;
      }),
      setPositionState: vi.fn(),
      metadata: null,
      playbackState: 'none',
    };

    Object.defineProperty(navigator, 'mediaSession', {
      value: mockMediaSession,
      writable: true,
      configurable: true,
    });

    class MockMediaMetadata {
      title: string;
      artist: string;
      album: string;
      artwork: { src: string; sizes?: string }[];
      constructor(init: {
        title: string;
        artist: string;
        album: string;
        artwork?: { src: string; sizes?: string }[];
      }) {
        this.title = init.title;
        this.artist = init.artist;
        this.album = init.album;
        this.artwork = init.artwork || [];
      }
    }

    Object.defineProperty(globalThis, 'MediaMetadata', {
      value: MockMediaMetadata,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaSession', {
      value: originalMediaSession,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'MediaMetadata', {
      value: originalMediaMetadata,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  it('should gracefully do nothing when navigator.mediaSession is not supported', () => {
    Object.defineProperty(navigator, 'mediaSession', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(() => {
      renderHook(() =>
        useMediaSession({
          currentSong: sampleSong,
          isPlaying: true,
          progress: 10,
          duration: 180,
          play: vi.fn(),
          pause: vi.fn(),
          next: vi.fn(),
          prev: vi.fn(),
          seek: vi.fn(),
        })
      );
    }).not.toThrow();
  });

  it('should register all action handlers on mount and clean them up on unmount', () => {
    const play = vi.fn();
    const pause = vi.fn();
    const next = vi.fn();
    const prev = vi.fn();
    const seek = vi.fn();

    const { unmount } = renderHook(() =>
      useMediaSession({
        currentSong: sampleSong,
        isPlaying: false,
        progress: 0,
        duration: 180,
        play,
        pause,
        next,
        prev,
        seek,
      })
    );

    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('play', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('pause', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('previoustrack', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('nexttrack', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('stop', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekto', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekbackward', expect.any(Function));
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekforward', expect.any(Function));

    // Verify calling action handlers triggers the corresponding functions
    mockActionHandlers['play']?.();
    expect(play).toHaveBeenCalledTimes(1);

    mockActionHandlers['pause']?.();
    expect(pause).toHaveBeenCalledTimes(1);

    mockActionHandlers['nexttrack']?.();
    expect(next).toHaveBeenCalledTimes(1);

    mockActionHandlers['previoustrack']?.();
    expect(prev).toHaveBeenCalledTimes(1);

    mockActionHandlers['stop']?.();
    expect(pause).toHaveBeenCalledTimes(2);

    mockActionHandlers['seekto']?.({ seekTime: 75 });
    expect(seek).toHaveBeenCalledWith(75);

    mockActionHandlers['seekbackward']?.({ seekOffset: 10 });
    expect(seek).toHaveBeenCalledWith(0);

    mockActionHandlers['seekforward']?.({ seekOffset: 15 });
    expect(seek).toHaveBeenCalledWith(15);

    // Unmount should clear all action handlers
    unmount();
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('play', null);
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('pause', null);
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('previoustrack', null);
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('nexttrack', null);
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('stop', null);
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekto', null);
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekbackward', null);
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('seekforward', null);
  });

  it('should update MediaMetadata when currentSong changes', () => {
    const { rerender } = renderHook(
      ({ song }) =>
        useMediaSession({
          currentSong: song,
          isPlaying: false,
          progress: 0,
          duration: 180,
          play: vi.fn(),
          pause: vi.fn(),
          next: vi.fn(),
          prev: vi.fn(),
          seek: vi.fn(),
        }),
      { initialProps: { song: sampleSong as Song | null } }
    );

    const metadata = mockMediaSession.metadata as {
      title: string;
      artist: string;
      album: string;
      artwork: { src: string }[];
    };
    expect(metadata).not.toBeNull();
    expect(metadata.title).toBe('Test Song');
    expect(metadata.artist).toBe('Test Artist');
    expect(metadata.album).toBe('Test Album');
    expect(metadata.artwork.length).toBeGreaterThan(0);
    expect(metadata.artwork[0].src).toBe(sampleSong.coverArt);

    // Set currentSong to null
    rerender({ song: null });
    expect(mockMediaSession.metadata).toBeNull();
  });

  it('should synchronize playbackState properly', () => {
    const { rerender } = renderHook(
      ({ isPlaying, song }) =>
        useMediaSession({
          currentSong: song,
          isPlaying,
          progress: 0,
          duration: 180,
          play: vi.fn(),
          pause: vi.fn(),
          next: vi.fn(),
          prev: vi.fn(),
          seek: vi.fn(),
        }),
      { initialProps: { isPlaying: false, song: sampleSong as Song | null } }
    );

    // Paused with song
    expect(mockMediaSession.playbackState).toBe('paused');

    // Playing
    rerender({ isPlaying: true, song: sampleSong });
    expect(mockMediaSession.playbackState).toBe('playing');

    // Stopped / No song
    rerender({ isPlaying: false, song: null });
    expect(mockMediaSession.playbackState).toBe('none');
  });

  it('should synchronize position state with setPositionState', () => {
    renderHook(() =>
      useMediaSession({
        currentSong: sampleSong,
        isPlaying: true,
        progress: 42,
        duration: 180,
        play: vi.fn(),
        pause: vi.fn(),
        next: vi.fn(),
        prev: vi.fn(),
        seek: vi.fn(),
      })
    );

    expect(mockMediaSession.setPositionState).toHaveBeenCalledWith({
      duration: 180,
      playbackRate: 1,
      position: 42,
    });
  });
});
