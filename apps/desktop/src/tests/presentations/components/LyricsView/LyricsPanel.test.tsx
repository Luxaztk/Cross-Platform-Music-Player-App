// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LyricsPanel } from '../../../../presentations/components/LyricsView/LyricsPanel';
import { useLyrics, usePlayer } from '@music/hooks';

// Mock dependencies
vi.mock('@music/hooks', () => ({
  useLyrics: vi.fn(),
  usePlayer: vi.fn(),
}));

vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

describe('LyricsPanel', () => {
  const mockSeek = vi.fn();
  const mockSearchLyrics = vi.fn();
  const mockSaveLyrics = vi.fn();
  const mockPatchLyricSearchParam = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock HTMLElement.prototype.scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    vi.mocked(usePlayer).mockReturnValue({
      currentSong: {
        id: '1',
        title: 'Test Song',
        artist: 'Test Artist',
      },
      seek: mockSeek,
    } as unknown as ReturnType<typeof usePlayer>);

    vi.mocked(useLyrics).mockReturnValue({
      lyricLines: [
        { time: 10, text: 'Line 1' },
        { time: 20, text: 'Line 2' },
      ],
      currentLineIndex: 0,
      isLoading: false,
      searchLyrics: mockSearchLyrics,
      saveLyrics: mockSaveLyrics,
      patchLyricSearchParam: mockPatchLyricSearchParam,
    } as unknown as ReturnType<typeof useLyrics>);
  });

  it('renders null if no current song', () => {
    vi.mocked(usePlayer).mockReturnValue({ currentSong: null } as unknown as ReturnType<typeof usePlayer>);
    const { container } = render(<LyricsPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('renders lyrics and handles line click', async () => {
    const user = userEvent.setup();
    render(<LyricsPanel />);

    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();

    await user.click(screen.getByText('Line 2'));
    expect(mockSeek).toHaveBeenCalledWith(20);
  });

  it('shows empty state when no lyrics and handles search', async () => {
    const user = userEvent.setup();
    vi.mocked(useLyrics).mockReturnValue({
      lyricLines: [],
      currentLineIndex: -1,
      isLoading: false,
      searchLyrics: mockSearchLyrics.mockResolvedValue([
        { id: 'search-1', trackName: 'Found Song', artistName: 'Found Artist', syncedLyrics: 'Found Lyrics' }
      ]),
      saveLyrics: mockSaveLyrics,
      patchLyricSearchParam: mockPatchLyricSearchParam,
    } as unknown as ReturnType<typeof useLyrics>);

    render(<LyricsPanel />);

    expect(screen.getByText('lyrics.noLyrics')).toBeInTheDocument();

    const searchBtn = screen.getByRole('button', { name: /lyrics.searchOnline/i });
    await user.click(searchBtn);

    expect(mockSearchLyrics).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(screen.getByText('Found Song')).toBeInTheDocument();
    });

    // Select search result
    await user.click(screen.getByText('Found Song'));
    expect(mockSaveLyrics).toHaveBeenCalledWith('Found Lyrics', 'search-1');
  });
});
