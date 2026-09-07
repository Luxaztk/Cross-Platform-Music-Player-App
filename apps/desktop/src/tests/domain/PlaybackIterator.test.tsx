// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { PlayerProvider, usePlayer } from '@music/hooks';
import { shuffleArray } from '@music/utils';
import type { Song } from '@music/types';
import React from 'react';

// Mock dependencies
let mockEngineInstance: {
  load: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  seek: ReturnType<typeof vi.fn>;
  setVolume: ReturnType<typeof vi.fn>;
  setSinkId: ReturnType<typeof vi.fn>;
  isPlaying: ReturnType<typeof vi.fn>;
  state: ReturnType<typeof vi.fn>;
  getSource: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  setEvents: ReturnType<typeof vi.fn>;
  events: Record<string, (...args: unknown[]) => void>;
};

vi.mock('@music/player', () => {
  const formatUrl = (path: string) =>
    /^https?:\/\//i.test(path) ? path : `melovista://app/${encodeURIComponent(path)}`;

  class MockAudioEngine {
    static formatUrl = vi.fn(formatUrl);
    load = vi.fn((path: string) => {
      this.lastUrl = formatUrl(path || '');
    });
    play = vi.fn();
    pause = vi.fn();
    stop = vi.fn();
    seek = vi.fn();
    setVolume = vi.fn();
    setSinkId = vi.fn();
    isPlaying = vi.fn().mockReturnValue(false);
    state = vi.fn().mockReturnValue('loaded');
    lastUrl: string | null = null;
    getSource = vi.fn().mockImplementation(() => this.lastUrl);
    on = vi.fn();
    off = vi.fn();
    destroy = vi.fn();
    events: Record<string, (...args: unknown[]) => void> = {};
    setEvents = vi.fn((ev: Record<string, (...args: unknown[]) => void>) => {
      this.events = ev;
    });

    constructor() {
      mockEngineInstance = this as unknown as typeof mockEngineInstance;
    }
  }

  return { AudioEngine: MockAudioEngine };
});

(window as unknown as { electronAPI: Record<string, ReturnType<typeof vi.fn>> }).electronAPI = {
  savePlayerState: vi.fn(),
  getPlayerState: vi.fn().mockResolvedValue(null)
};

describe('PlaybackIterator (PlayerProvider Hook)', () => {
  const mockSongs: Song[] = [
    { id: '1', title: 'Song 1', artist: 'Artist 1', filePath: '1.mp3', duration: 100 } as unknown as Song,
    { id: '2', title: 'Song 2', artist: 'Artist 2', filePath: '2.mp3', duration: 100 } as unknown as Song,
    { id: '3', title: 'Song 3', artist: 'Artist 3', filePath: '3.mp3', duration: 100 } as unknown as Song,
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

  it('[TC10] Bấm next() khi bật repeatMode = ONE vẫn chuyển sang bài tiếp theo trong Queue', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    act(() => {
      result.current.playList(mockSongs, 0);
      result.current.setRepeatMode('ONE');
    });

    expect(result.current.currentSong?.id).toBe('1');
    expect(result.current.repeatMode).toBe('ONE');

    // Bấm Next thủ công
    act(() => {
      result.current.next();
    });

    // Phải chuyển sang bài 2, không được tua ngược về 0 của bài 1
    expect(result.current.currentSong?.id).toBe('2');
    expect(result.current.history[0]?.id).toBe('1');
  });

  it('[TC11] Bấm prev() 1 lần duy nhất lập tức lùi về bài trước đó trong history', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    act(() => {
      result.current.playList(mockSongs, 0);
    });

    act(() => {
      result.current.next(); // Sang bài 2
    });
    expect(result.current.currentSong?.id).toBe('2');

    // Giả lập progress > 3s
    act(() => {
      mockEngineInstance.events.onProgress?.(10, 100);
    });
    expect(result.current.progress).toBe(10);

    // Bấm Prev 1 lần duy nhất: lùi ngay về bài 1 trong history
    act(() => {
      result.current.prev();
    });
    expect(result.current.currentSong?.id).toBe('1');

    // Khi history trống (đang ở bài 1), bấm Prev sẽ tua về đầu bài 1
    act(() => {
      mockEngineInstance.events.onProgress?.(20, 100);
    });
    act(() => {
      result.current.prev();
    });
    expect(result.current.currentSong?.id).toBe('1');
    expect(mockEngineInstance.seek).toHaveBeenCalledWith(0);
  });

  it('[TC12] Gọi play() khi engine state là loading vẫn kích hoạt engine.play()', async () => {
    const { result } = renderHook(() => usePlayer(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    act(() => {
      result.current.playList(mockSongs, 0);
    });

    // Giả lập engine ở trạng thái loading (như file dài đang buffer)
    mockEngineInstance.state.mockReturnValue('loading');
    mockEngineInstance.play.mockClear();

    // Gọi play()
    act(() => {
      result.current.play();
    });

    // engine.play() phải được gọi, không bị chặn bởi state === 'loaded'
    expect(mockEngineInstance.play).toHaveBeenCalled();
  });
});
