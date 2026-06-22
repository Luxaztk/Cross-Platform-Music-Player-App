// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PlayerBar } from '../../../../presentations/components/PlayerBar';
import { usePlayer, useUI } from '@music/hooks';
import { useTheme } from '@hooks';

// Mock dependencies
vi.mock('@music/hooks', () => ({
  usePlayer: vi.fn(),
  useUI: vi.fn(),
}));

vi.mock('@hooks', () => ({
  useTheme: vi.fn(),
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@application/context/HotkeysContext', () => ({
  useHotkeysModal: () => ({ openHotkeysModal: vi.fn() })
}));

vi.mock('../../../../presentations/components/PlayerBar/QueuePanel', () => ({
  default: () => <div data-testid="queue-panel">Queue Panel</div>,
}));

vi.mock('@constants', () => ({
  ICON_SIZES: {
    XSMALL: 14,
    SMALL: 16,
    MEDIUM: 24,
    LARGE: 32,
  },
}));

describe('PlayerBar', () => {
  const mockPlay = vi.fn();
  const mockPause = vi.fn();
  const mockNext = vi.fn();
  const mockPrev = vi.fn();
  const mockSetVolume = vi.fn();
  const mockSeek = vi.fn();
  const mockToggleShuffle = vi.fn();
  const mockSetRepeatMode = vi.fn();
  const mockToggleLyrics = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useTheme).mockReturnValue({
      appIcon: 'test-icon.png',
    } as unknown as ReturnType<typeof useTheme>);

    vi.mocked(useUI).mockReturnValue({
      isLyricsOpen: false,
      toggleLyrics: mockToggleLyrics,
    } as unknown as ReturnType<typeof useUI>);

    vi.mocked(usePlayer).mockReturnValue({
      currentSong: {
        id: '1',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 300,
        coverArt: 'test-cover.png',
      },
      isPlaying: false,
      play: mockPlay,
      pause: mockPause,
      next: mockNext,
      prev: mockPrev,
      progress: 100,
      duration: 300,
      volume: 0.8,
      setVolume: mockSetVolume,
      seek: mockSeek,
      queue: [],
      isShuffle: false,
      toggleShuffle: mockToggleShuffle,
      repeatMode: 'OFF',
      setRepeatMode: mockSetRepeatMode,
    } as unknown as ReturnType<typeof usePlayer>);
  });

  it('renders track metadata correctly', () => {
    render(<PlayerBar />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByAltText('Test Song')).toHaveAttribute('src', 'test-cover.png');
  });

  it('handles play/pause toggle', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PlayerBar />);
    
    const playBtn = screen.getByTitle('player.play');
    await user.click(playBtn);
    expect(mockPlay).toHaveBeenCalled();

    vi.mocked(usePlayer).mockReturnValue({
      ...vi.mocked(usePlayer)(),
      isPlaying: true,
    } as unknown as ReturnType<typeof usePlayer>);
    
    rerender(<PlayerBar />);
    const pauseBtn = screen.getByTitle('player.pause');
    await user.click(pauseBtn);
    expect(mockPause).toHaveBeenCalled();
  });

  it('handles playback controls', async () => {
    const user = userEvent.setup();
    render(<PlayerBar />);
    
    await user.click(screen.getByTitle('player.next'));
    expect(mockNext).toHaveBeenCalled();
    
    await user.click(screen.getByTitle('player.previous'));
    expect(mockPrev).toHaveBeenCalled();
  });

  it('toggles shuffle and repeat', async () => {
    const user = userEvent.setup();
    render(<PlayerBar />);
    
    await user.click(screen.getByTitle('player.shuffle'));
    expect(mockToggleShuffle).toHaveBeenCalled();
    
    await user.click(screen.getByTitle('player.repeat'));
    expect(mockSetRepeatMode).toHaveBeenCalledWith('ALL');
  });

  it('updates volume', () => {
    render(<PlayerBar />);
    const volumeSlider = screen.getByPlaceholderText('Volume');
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    expect(mockSetVolume).toHaveBeenCalledWith(0.5);
  });

  it('handles seeking', () => {
    render(<PlayerBar />);
    const progressSlider = screen.getByPlaceholderText('Player');
    
    fireEvent.pointerDown(progressSlider);
    fireEvent.change(progressSlider, { target: { value: '200' } });
    fireEvent.pointerUp(progressSlider);
    
    expect(mockSeek).toHaveBeenCalledWith(200);
  });

  it('opens and closes queue panel', async () => {
    const user = userEvent.setup();
    render(<PlayerBar />);
    
    const queueBtn = screen.getByTitle('player.queue');
    await user.click(queueBtn);
    expect(screen.getByTestId('queue-panel')).toBeInTheDocument();
    
    await user.click(queueBtn);
    expect(screen.queryByTestId('queue-panel')).not.toBeInTheDocument();
  });

  it('toggles lyrics', async () => {
    const user = userEvent.setup();
    render(<PlayerBar />);
    
    await user.click(screen.getByTitle('player.lyrics'));
    expect(mockToggleLyrics).toHaveBeenCalled();
  });
});
