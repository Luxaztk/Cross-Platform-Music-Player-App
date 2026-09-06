// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChapterEditorModal } from '@components/ChapterEditorModal';
import type { Song, SongChapter } from '@music/types';

const mockHandlePatchSong = vi.fn();
const mockUpdateCurrentSongMetadata = vi.fn();

vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options?.count !== undefined) return `${key}:${String(options.count)}`;
      return key;
    },
  }),
  useLibrary: () => ({
    handlePatchSong: mockHandlePatchSong,
  }),
}));

vi.mock('@music/hooks', () => ({
  usePlayer: () => ({
    currentSong: { id: 'song-1' },
    updateCurrentSongMetadata: mockUpdateCurrentSongMetadata,
  }),
}));


describe('ChapterEditorModal', () => {
  const mockChapters: SongChapter[] = [
    { id: 'ch-1', title: 'Intro', startTime: 0, endTime: 60 },
    { id: 'ch-2', title: 'Verse 1', startTime: 60, endTime: 180 },
  ];

  const mockSong: Song = {
    id: 'song-1',
    title: 'Epic Mix 2026',
    artist: 'DJ Melo',
    artists: ['DJ Melo'],
    album: 'Mix Album',
    genre: 'Electronic',
    year: 2026,
    coverArt: null,
    duration: 300,
    filePath: '/music/epic_mix.mp3',
    hash: 'p2:abc12345',
    chapters: mockChapters,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    song: mockSong,
    currentAudioTime: 75,
    onSeek: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.electronAPI = {
      patchSong: vi.fn().mockResolvedValue(mockSong),
      selectDirectory: vi.fn().mockResolvedValue('/export/dir'),
      exportChapters: vi.fn().mockResolvedValue({ success: true, exportedCount: 2 }),
    } as unknown as typeof window.electronAPI;
  });

  it('renders nothing when isOpen is false or song is null', () => {
    const { container, rerender } = render(<ChapterEditorModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ChapterEditorModal {...defaultProps} song={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders song title and initial chapters', () => {
    render(<ChapterEditorModal {...defaultProps} />);

    expect(screen.getByText(/Epic Mix 2026/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Intro')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Verse 1')).toBeInTheDocument();
  });

  it('allows adding a new chapter', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    const addBtn = screen.getByRole('button', { name: /chapters\.addChapter/i });
    await user.click(addBtn);

    // New chapter input should appear
    expect(screen.getByDisplayValue(/chapters\.chapterName 3/i)).toBeInTheDocument();
  });

  it('allows editing chapter title inline', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    const input = screen.getByDisplayValue('Intro');
    await user.clear(input);
    await user.type(input, 'New Intro Track');

    expect(screen.getByDisplayValue('New Intro Track')).toBeInTheDocument();
  });

  it('allows micro-adjusting chapter start time', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    // Click +1s button for the first chapter
    const plusOneBtns = screen.getAllByRole('button', { name: '+1s' });
    await user.click(plusOneBtns[0]);

    // Save button should become enabled because state is dirty
    const saveBtn = screen.getByRole('button', { name: /chapters\.save/i });
    expect(saveBtn).not.toBeDisabled();
  });

  it('allows pinning current playback time to a chapter', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} currentAudioTime={99} />);

    const pinBtns = screen.getAllByRole('button', { name: /📌/i });
    await user.click(pinBtns[0]);

    // First chapter time was updated to 99s (1:39)
    expect(screen.getAllByText(/1:39/i).length).toBeGreaterThanOrEqual(1);
  });

  it('allows editing chapter artist inline', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    const artistInputs = screen.getAllByTitle('chapters.artist');
    expect(artistInputs.length).toBe(2);

    await user.type(artistInputs[0], 'Artist Solo');
    expect(screen.getByDisplayValue('Artist Solo')).toBeInTheDocument();
  });

  it('allows swapping chapter title and artist with 1-click swap button', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    // First set an artist
    const artistInputs = screen.getAllByTitle('chapters.artist');
    await user.type(artistInputs[0], 'Artist Solo');

    const swapBtns = screen.getAllByRole('button', { name: /chapters\.swapArtistTitle/i });
    await user.click(swapBtns[0]);

    // Title should now be 'Artist Solo', Artist should now be 'Intro'
    const titleInputs = screen.getAllByTitle('chapters.chapterName');
    expect(titleInputs[0]).toHaveValue('Artist Solo');
    expect(artistInputs[0]).toHaveValue('Intro');
  });

  it('allows toggling auto-skip on a chapter', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    const skipBtns = screen.getAllByTitle(/chapters\.skipChapter/i);
    await user.click(skipBtns[0]);

    // Button title changes to skippedBadge and row gets is-skipped class
    expect(screen.getByTitle(/chapters\.skippedBadge/i)).toBeInTheDocument();
  });

  it('calls onSeek when preview button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    const previewBtns = screen.getAllByTitle(/chapters\.preview/i);
    await user.click(previewBtns[1]);

    expect(defaultProps.onSeek).toHaveBeenCalledWith(60);
  });

  it('saves chapters when save button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    // Make dirty by editing title
    const input = screen.getByDisplayValue('Intro');
    await user.type(input, ' edited');

    const saveBtn = screen.getByRole('button', { name: /chapters\.save/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockHandlePatchSong).toHaveBeenCalledWith('song-1', expect.objectContaining({
        chapters: expect.any(Array),
      }));
      expect(mockUpdateCurrentSongMetadata).toHaveBeenCalled();
      expect(defaultProps.onSave).toHaveBeenCalled();
    });
  });

  it('exports physical slices via electronAPI when export button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    const exportBtn = screen.getByRole('button', { name: /chapters\.exportSlices/i });
    await user.click(exportBtn);

    await waitFor(() => {
      expect(window.electronAPI.selectDirectory).toHaveBeenCalled();
      expect(window.electronAPI.exportChapters).toHaveBeenCalledWith('song-1', expect.any(Array), '/export/dir');
      expect(screen.getByText(/chapters\.exportSuccess:2/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button or cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    const cancelBtns = screen.getAllByRole('button', { name: /chapters\.close/i });
    await user.click(cancelBtns[0]);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('toggles fullscreen/expanded mode when expand/restore button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChapterEditorModal {...defaultProps} />);

    const modal = document.querySelector('.chapter-editor-modal');
    expect(modal).not.toHaveClass('is-expanded');

    const expandBtn = screen.getByRole('button', { name: /chapters\.maximize/i });
    await user.click(expandBtn);

    expect(modal).toHaveClass('is-expanded');
    expect(screen.getByRole('button', { name: /chapters\.restore/i })).toBeInTheDocument();

    const restoreBtn = screen.getByRole('button', { name: /chapters\.restore/i });
    await user.click(restoreBtn);

    expect(modal).not.toHaveClass('is-expanded');
    expect(screen.getByRole('button', { name: /chapters\.maximize/i })).toBeInTheDocument();
  });
});
