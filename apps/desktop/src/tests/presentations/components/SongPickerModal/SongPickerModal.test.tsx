import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SongPickerModal } from '../../../../presentations/components/SongPickerModal/SongPickerModal';
import type { Song } from '@music/types';

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="icon-x" />,
  Search: () => <div data-testid="icon-search" />,
  Check: () => <div data-testid="icon-check" />,
  Loader2: () => <div data-testid="icon-loader" />,
}));

// Mock @hooks
vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
  useTheme: () => ({
    appIcon: 'mock-app-icon.png',
  }),
  // Mock useClusteredSearch to do simple filtering for testing
  useClusteredSearch: (songs: Song[], query: string) => {
    const q = query.toLowerCase();
    const filtered = songs.filter(s => s.title.toLowerCase().includes(q) || (s.artist && s.artist.toLowerCase().includes(q)));
    return {
      clusteredResults: {
        titles: filtered,
        artists: [],
        albums: []
      },
      debouncedQuery: query,
      isDebouncing: false
    };
  },
  useSearch: (items: Song[], _keys: (keyof Song)[], query: string) => {
    const q = query.toLowerCase();
    return {
        songs: items.filter(item => item.title?.toLowerCase().includes(q) || item.artist?.toLowerCase().includes(q)),
        debouncedQuery: query,
        isSearching: false
    };
  }
}));

// Mock constants
vi.mock('@constants', () => ({
  ICON_SIZES: { SMALL: 16, MEDIUM: 24, XSMALL: 12 },
}));

describe('SongPickerModal', () => {
  const defaultSongs = [
    { id: 's1', title: 'Song 1', artist: 'Artist 1', coverArt: 'cover1.png' },
    { id: 's2', title: 'Song 2', artist: 'Artist 2' }, // no coverArt
    { id: 's3', title: 'Another Track', artist: 'Someone Else' },
  ] as unknown as Song[];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    allSongs: defaultSongs,
    existingSongIds: [],
    onAdd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<SongPickerModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all songs when search is empty', () => {
    render(<SongPickerModal {...defaultProps} />);
    
    expect(screen.getByText('modal.selectSongs')).toBeInTheDocument();
    expect(screen.getByText('Song 1')).toBeInTheDocument();
    expect(screen.getByText('Artist 1')).toBeInTheDocument();
    expect(screen.getByText('Song 2')).toBeInTheDocument();
    expect(screen.getByText('Another Track')).toBeInTheDocument();
  });

  it('filters songs based on search query', async () => {
    const user = userEvent.setup();
    render(<SongPickerModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('header.searchPlaceholder');
    await user.type(input, 'Song');
    
    expect(screen.getByText('Song 1')).toBeInTheDocument();
    expect(screen.getByText('Song 2')).toBeInTheDocument();
    expect(screen.queryByText('Another Track')).not.toBeInTheDocument();
  });

  it('shows no results state when query does not match', async () => {
    const user = userEvent.setup();
    render(<SongPickerModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('header.searchPlaceholder');
    await user.type(input, 'xyz123');
    
    expect(screen.getByText('sidebar.noResults')).toBeInTheDocument();
    expect(screen.queryByText('Song 1')).not.toBeInTheDocument();
  });

  it('allows selecting and deselecting songs', async () => {
    const user = userEvent.setup();
    render(<SongPickerModal {...defaultProps} />);
    
    // Initial state: 0 selected, Add button disabled
    const addBtn = screen.getByText(/common\.addSelected/);
    expect(addBtn).toBeDisabled();
    
    // Select a song
    const song1 = screen.getByText('Song 1').closest('.song-item');
    await user.click(song1!);
    
    // Should have Check icon and selected class
    expect(song1).toHaveClass('selected');
    expect(addBtn).not.toBeDisabled();
    expect(screen.getByText(/1\)/)).toBeInTheDocument(); // checks if "(1)" is in the text
    
    // Deselect
    await user.click(song1!);
    expect(song1).not.toHaveClass('selected');
    expect(addBtn).toBeDisabled();
  });

  it('calls onAdd with selected ids when Add button is clicked', async () => {
    const user = userEvent.setup();
    render(<SongPickerModal {...defaultProps} />);
    
    const song1 = screen.getByText('Song 1').closest('.song-item');
    const song3 = screen.getByText('Another Track').closest('.song-item');
    
    await user.click(song1!);
    await user.click(song3!);
    
    const addBtn = screen.getByText(/common\.addSelected/);
    await user.click(addBtn);
    
    expect(defaultProps.onAdd).toHaveBeenCalledWith(['s1', 's3']);
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<SongPickerModal {...defaultProps} />);
    
    const closeBtn = screen.getByTitle('common.close');
    await user.click(closeBtn);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<SongPickerModal {...defaultProps} />);
    
    const overlay = container.querySelector('.song-picker-modal-overlay');
    await user.click(overlay!);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('prevents event propagation when modal content is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<SongPickerModal {...defaultProps} />);
    
    const modalContent = container.querySelector('.song-picker-modal');
    await user.click(modalContent!);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('renders default icon when song has no coverArt', () => {
    const { container } = render(<SongPickerModal {...defaultProps} />);
    
    // Song 2 has no cover art, so it uses appIcon
    const imgs = container.querySelectorAll('img');
    const defaultImg = Array.from(imgs).find(img => img.getAttribute('src') === 'mock-app-icon.png');
    
    expect(defaultImg).toBeInTheDocument();
  });
});
