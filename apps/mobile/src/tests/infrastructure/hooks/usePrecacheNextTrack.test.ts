import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrecacheNextTrack } from '../../../infrastructure/hooks/usePrecacheNextTrack';
import { MobileAudioCacheService } from '../../../infrastructure/services/MobileAudioCacheService';
import { usePlayer } from '@music/hooks';

vi.mock('@music/hooks', () => ({
  usePlayer: vi.fn(),
}));

vi.mock('../../../infrastructure/services/MobileAudioCacheService', () => ({
  MobileAudioCacheService: {
    cacheSongStream: vi.fn().mockResolvedValue('mock-cached-uri'),
  },
}));

describe('usePrecacheNextTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not trigger pre-caching when progress is below 50%', () => {
    vi.mocked(usePlayer).mockReturnValue({
      currentSong: { id: 's1', title: 'Song 1', duration: 200 } as any,
      progress: 80, // 80 / 200 = 40% < 50%
      duration: 200,
      queue: [
        {
          uid: 'q1',
          song: { id: 's2', title: 'Song 2', streamUrl: 'http://server/stream/s2' } as any,
        },
      ],
    } as any);

    renderHook(() => usePrecacheNextTrack());

    expect(MobileAudioCacheService.cacheSongStream).not.toHaveBeenCalled();
  });

  it('triggers pre-caching when progress reaches 50% and next song is remote stream', () => {
    vi.mocked(usePlayer).mockReturnValue({
      currentSong: { id: 's1', title: 'Song 1', duration: 200 } as any,
      progress: 105, // 105 / 200 = 52.5% >= 50%
      duration: 200,
      queue: [
        {
          uid: 'q1',
          song: { id: 's2', title: 'Song 2', streamUrl: 'http://server/stream/s2' } as any,
        },
      ],
    } as any);

    renderHook(() => usePrecacheNextTrack());

    expect(MobileAudioCacheService.cacheSongStream).toHaveBeenCalledWith(
      's2',
      'http://server/stream/s2'
    );
  });

  it('does not pre-cache if next song is already marked isOffline', () => {
    vi.mocked(usePlayer).mockReturnValue({
      currentSong: { id: 's1', title: 'Song 1', duration: 200 } as any,
      progress: 120, // 60%
      duration: 200,
      queue: [
        {
          uid: 'q1',
          song: {
            id: 's2',
            title: 'Song 2',
            streamUrl: 'http://server/stream/s2',
            isOffline: true,
          } as any,
        },
      ],
    } as any);

    renderHook(() => usePrecacheNextTrack());

    expect(MobileAudioCacheService.cacheSongStream).not.toHaveBeenCalled();
  });

  it('does not duplicate pre-caching call on subsequent renders', () => {
    const playerState = {
      currentSong: { id: 's1', title: 'Song 1', duration: 200 } as any,
      progress: 110,
      duration: 200,
      queue: [
        {
          uid: 'q1',
          song: { id: 's2', title: 'Song 2', streamUrl: 'http://server/stream/s2' } as any,
        },
      ],
    };

    vi.mocked(usePlayer).mockReturnValue(playerState as any);

    const { rerender } = renderHook(() => usePrecacheNextTrack());
    expect(MobileAudioCacheService.cacheSongStream).toHaveBeenCalledTimes(1);

    // Subsequent tick
    playerState.progress = 115;
    rerender();
    expect(MobileAudioCacheService.cacheSongStream).toHaveBeenCalledTimes(1);
  });
});
