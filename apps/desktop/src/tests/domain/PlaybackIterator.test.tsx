// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { PlayerProvider, usePlayer } from '@music/hooks';
import { shuffleArray } from '@music/utils';
import type { Song } from '@music/types';
import React from 'react';

// Mock dependencies
vi.mock('@music/player', () => ({
  AudioEngine: class {
    load = vi.fn();
    play = vi.fn();
    pause = vi.fn();
    stop = vi.fn();
    seek = vi.fn();
    setVolume = vi.fn();
    setSinkId = vi.fn();
    isPlaying = vi.fn().mockReturnValue(false);
    on = vi.fn();
    off = vi.fn();
    destroy = vi.fn();
    setEvents = vi.fn();
  }
}));

(window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI = {
  savePlayerState: vi.fn(),
  getPlayerState: vi.fn().mockResolvedValue(null)
};

describe('PlaybackIterator (PlayerProvider Hook)', () => {
  const mockSongs: Song[] = [
    { id: '1', title: 'Song 1', artist: 'Artist 1', path: '1.mp3', duration: 100 } as unknown as Song,
    { id: '2', title: 'Song 2', artist: 'Artist 2', path: '2.mp3', duration: 100 } as unknown as Song,
    { id: '3', title: 'Song 3', artist: 'Artist 3', path: '3.mp3', duration: 100 } as unknown as Song,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PlayerProvider>{children}</PlayerProvider>
  );

  it('[TC07] Điều hướng tới bài hát tiếp theo (Linear)', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });

    // Cần chờ state khởi tạo xong do có useEffect getPlayerState
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Phát danh sách (Play context)
    act(() => {
      result.current.playList(mockSongs, 0);
    });

    expect(result.current.currentSong?.id).toBe('1');
    expect(result.current.queue.length).toBe(2);

    // Act: Gọi next()
    act(() => {
      result.current.next();
    });

    // Bài hát bị chuyển thành bài tiếp theo
    expect(result.current.currentSong?.id).toBe('2');
    expect(result.current.queue.length).toBe(1);
    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].id).toBe('1');
  });

  it('[TC08] Lùi về bài hát trước đó (Previous)', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Phát danh sách
    act(() => {
      result.current.playList(mockSongs, 0);
    });

    act(() => {
      result.current.next(); // Sang bài 2
    });

    expect(result.current.currentSong?.id).toBe('2');
    expect(result.current.history.length).toBe(1);

    // Act: Gọi prev()
    act(() => {
      result.current.prev();
    });

    // Phải lùi về bài 1
    expect(result.current.currentSong?.id).toBe('1');
    // Bài 2 bị đẩy ngược vào queue
    expect(result.current.queue[0].song.id).toBe('2');
  });

  it('[TC09] Kiểm thử thuật toán xáo trộn (Shuffle)', () => {
    const original = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      title: `Song ${i}`
    } as Song));

    const shuffled = shuffleArray([...original]);

    // Độ dài không đổi
    expect(shuffled.length).toBe(original.length);

    // Phải chứa đủ phần tử
    const originalIds = original.map(s => s.id).sort();
    const shuffledIds = shuffled.map(s => s.id).sort();
    expect(shuffledIds).toEqual(originalIds);

    // Thứ tự phải khác biệt (Xác suất giống hệt nhau là cực thấp: 1/10!)
    const isDifferentOrder = original.some((item, index) => item.id !== shuffled[index].id);
    expect(isDifferentOrder).toBe(true);
  });
});
