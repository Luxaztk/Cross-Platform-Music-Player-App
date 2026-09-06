import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMobileLockScreen } from '../../../infrastructure/hooks/useMobileLockScreen';
import { usePlayer } from '@music/hooks';
import type { MobileAudioAdapter } from '../../../infrastructure/audio/MobileAudioAdapter';

vi.mock('@music/hooks', () => ({
  usePlayer: vi.fn(),
}));

describe('useMobileLockScreen', () => {
  let mockAdapter: { updateLockScreen: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdapter = {
      updateLockScreen: vi.fn(),
    };
  });

  it('calls updateLockScreen with true and song metadata when currentSong is present', () => {
    const song = {
      id: 'song-1',
      title: 'Echoes',
      artist: 'Pink Floyd',
      album: 'Meddle',
      coverArt: 'file://art.jpg',
    } as any;

    vi.mocked(usePlayer).mockReturnValue({
      currentSong: song,
    } as any);

    renderHook(() => useMobileLockScreen({ adapter: mockAdapter as unknown as MobileAudioAdapter }));

    expect(mockAdapter.updateLockScreen).toHaveBeenCalledTimes(1);
    expect(mockAdapter.updateLockScreen).toHaveBeenCalledWith(true, song);
  });

  it('calls updateLockScreen with false when currentSong is null', () => {
    vi.mocked(usePlayer).mockReturnValue({
      currentSong: null,
    } as any);

    renderHook(() => useMobileLockScreen({ adapter: mockAdapter as unknown as MobileAudioAdapter }));

    expect(mockAdapter.updateLockScreen).toHaveBeenCalledTimes(1);
    expect(mockAdapter.updateLockScreen).toHaveBeenCalledWith(false);
  });

  it('updates lock screen metadata when currentSong changes', () => {
    const songA = { id: 'song-a', title: 'Song A', artist: 'Artist A' } as any;
    const songB = { id: 'song-b', title: 'Song B', artist: 'Artist B' } as any;

    let currentSong = songA;
    vi.mocked(usePlayer).mockImplementation(() => ({ currentSong } as any));

    const { rerender } = renderHook(() =>
      useMobileLockScreen({ adapter: mockAdapter as unknown as MobileAudioAdapter })
    );

    expect(mockAdapter.updateLockScreen).toHaveBeenCalledWith(true, songA);

    // Switch track
    currentSong = songB;
    rerender();

    expect(mockAdapter.updateLockScreen).toHaveBeenCalledWith(true, songB);
    expect(mockAdapter.updateLockScreen).toHaveBeenCalledTimes(2);
  });
});
