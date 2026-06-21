import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SongRow } from '../../../../../presentations/pages/PlaylistDetailPage/components/SongRow';
import type { Song } from '@music/types';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  CheckSquare: () => <div data-testid="icon-check-square" />,
  Square: () => <div data-testid="icon-square" />,
  Play: () => <div data-testid="icon-play" />,
  MoreVertical: () => <div data-testid="icon-more-vertical" />,
}));

const mockSong = {
  id: 'song-1',
  title: 'Test Song',
  artist: 'Artist A ft. Artist B',
  album: 'Test Album',
  duration: 180
} as Song;

describe('SongRow', () => {
  const defaultProps = {
    song: mockSong,
    index: 0,
    isSelected: false,
    isPlaying: false,
    isActiveMenu: false,
    playlists: [],
    currentPlaylistId: undefined,
    hasActiveSelection: false,
    appIcon: 'test-icon.png',
    t: (key: string) => key,
    onToggleSelect: vi.fn(),
    onPlay: vi.fn(),
    onPlayNext: vi.fn(),
    onAddToQueue: vi.fn(),
    onAddToPlaylist: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleFilter: vi.fn(),
    onToggleMenu: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<SongRow {...defaultProps} />);

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Artist A')).toBeInTheDocument();
    expect(screen.getByText('Artist B')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Index + 1
  });

  it('calls onPlay when clicking the row background', async () => {
    const user = userEvent.setup();
    const { container } = render(<SongRow {...defaultProps} />);

    const row = container.querySelector('.song-row');
    if (row) await user.click(row);

    expect(defaultProps.onPlay).toHaveBeenCalledTimes(1);
    expect(defaultProps.onToggleSelect).not.toHaveBeenCalled();
  });

  it('calls onToggleSelect when clicking the row with Ctrl key', async () => {
    const user = userEvent.setup();
    const { container } = render(<SongRow {...defaultProps} />);

    const row = container.querySelector('.song-row');
    if (row) {
      await user.keyboard('[ControlLeft>]');
      await user.click(row);
      await user.keyboard('[/ControlLeft]');
    }

    expect(defaultProps.onToggleSelect).toHaveBeenCalledWith('song-1', expect.anything());
    expect(defaultProps.onPlay).not.toHaveBeenCalled();
  });

  it('calls onToggleSelect when clicking the row with Shift key', async () => {
    const user = userEvent.setup();
    const { container } = render(<SongRow {...defaultProps} />);

    const row = container.querySelector('.song-row');
    if (row) {
      await user.keyboard('[ShiftLeft>]');
      await user.click(row);
      await user.keyboard('[/ShiftLeft]');
    }

    expect(defaultProps.onToggleSelect).toHaveBeenCalledWith('song-1', expect.anything());
    expect(defaultProps.onPlay).not.toHaveBeenCalled();
  });

  it('calls onToggleSelect when clicking the index column', async () => {
    const user = userEvent.setup();
    const { container } = render(<SongRow {...defaultProps} />);

    const idxCol = container.querySelector('.col-idx');
    if (idxCol) await user.click(idxCol);

    expect(defaultProps.onToggleSelect).toHaveBeenCalledWith('song-1', expect.anything());
    expect(defaultProps.onPlay).not.toHaveBeenCalled();
  });

  it('renders CheckSquare when isSelected is true and hasActiveSelection is true', () => {
    render(<SongRow {...defaultProps} hasActiveSelection={true} isSelected={true} />);
    expect(screen.getByTestId('icon-check-square')).toBeInTheDocument();
  });

  it('renders Square when isSelected is false but hasActiveSelection is true', () => {
    render(<SongRow {...defaultProps} hasActiveSelection={true} isSelected={false} />);
    expect(screen.getByTestId('icon-square')).toBeInTheDocument();
  });

  it('calls onPlay when clicking the title and stops propagation', async () => {
    const user = userEvent.setup();
    render(<SongRow {...defaultProps} />);

    const title = screen.getByText('Test Song');
    await user.click(title);

    expect(defaultProps.onPlay).toHaveBeenCalledTimes(1);
    expect(defaultProps.onToggleSelect).not.toHaveBeenCalled();
  });

  it('calls onToggleFilter when clicking an artist part', async () => {
    const user = userEvent.setup();
    render(<SongRow {...defaultProps} />);

    const artistA = screen.getByText('Artist A');
    await user.click(artistA);

    expect(defaultProps.onToggleFilter).toHaveBeenCalledWith('artist', 'Artist A');
    expect(defaultProps.onPlay).not.toHaveBeenCalled();
  });
});
