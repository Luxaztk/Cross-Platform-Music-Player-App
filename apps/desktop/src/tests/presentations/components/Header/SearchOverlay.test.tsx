import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchOverlay } from '../../../../presentations/components/Header/SearchOverlay/SearchOverlay';
import { groupAndSortSongs } from '../../../../application/utils/searchUtils';
import type { Song } from '@music/types';

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
  CornerDownLeft: () => <div data-testid="icon-corner" />,
  ArrowUp: () => <div data-testid="icon-arrow-up" />,
  ArrowDown: () => <div data-testid="icon-arrow-down" />,
  Search: () => <div data-testid="icon-search" />,
  Loader2: () => <div data-testid="icon-loader" />,
  MoreVertical: () => <div data-testid="icon-more" />,
  Play: () => <div data-testid="icon-play" />,
  ListPlus: () => <div data-testid="icon-list-plus" />,
  Clock: () => <div data-testid="icon-clock" />,
  X: () => <div data-testid="icon-x" />,
  Trash2: () => <div data-testid="icon-trash" />,
  PlaySquare: () => <div data-testid="icon-play-square" />,
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock @hooks
vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
  useTheme: () => ({
    appIcon: 'mock-icon.png',
  }),
}));

// Mock searchUtils
vi.mock('../../../../application/utils/searchUtils', () => ({
  groupAndSortSongs: vi.fn(),
}));

describe('SearchOverlay', () => {
  const defaultProps = {
    query: '',
    results: {
      songs: [],
      playlists: [],
      albums: [],
      artists: [],
      isSearching: false,
      debouncedQuery: '',
    },
    recentSearches: [],
    selectedIndex: -1,
    onSelect: vi.fn(),
    onSelectRecent: vi.fn(),
    onRemoveRecent: vi.fn(),
    onClearRecent: vi.fn(),
    onPlayNext: vi.fn(),
    onAddToQueue: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(groupAndSortSongs).mockReturnValue({
      titles: [],
      artists: [],
      albums: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders null if no query and no recent searches', () => {
    const { container } = render(<SearchOverlay {...defaultProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders RecentSearches if no query but has recent searches', () => {
    const props = {
      ...defaultProps,
      recentSearches: [
        { type: 'query', text: 'hello', timestamp: 1 },
        { type: 'entity', entityType: 'artist', name: 'world', timestamp: 2 }
      ] as unknown as typeof defaultProps.recentSearches,
    };
    render(<SearchOverlay {...props} />);
    expect(screen.getByText('search.recent')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('renders searching state when isSearching is true and query is not empty', () => {
    const props = {
      ...defaultProps,
      query: 'a',
      results: { ...defaultProps.results, isSearching: true },
    };
    render(<SearchOverlay {...props} />);
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
    expect(screen.getByText('downloader.searching')).toBeInTheDocument();
  });

  it('renders no results state when query is provided but results are empty', () => {
    const props = {
      ...defaultProps,
      query: 'empty-query',
    };
    render(<SearchOverlay {...props} />);
    expect(screen.getByTestId('icon-search')).toBeInTheDocument();
    expect(screen.getByText(/search.noResults/)).toBeInTheDocument();
    expect(screen.getByText(/"empty-query"/)).toBeInTheDocument();
  });

  it('renders clustered songs correctly', () => {
    const song1 = { id: 's1', title: 'Song Title 1', artist: 'Artist 1' };
    const song2 = { id: 's2', title: 'Another Song', artist: 'Artist Title 2' };
    const song3 = { id: 's3', title: 'Song Album 3', artist: 'Artist 3' };

    vi.mocked(groupAndSortSongs).mockReturnValue({
      titles: [song1 as unknown as Song],
      artists: [song2 as unknown as Song],
      albums: [song3 as unknown as Song],
    });

    const props = {
      ...defaultProps,
      query: 'Song',
      results: {
        ...defaultProps.results,
        songs: [song1, song2, song3] as unknown as Song[],
      },
    };

    render(<SearchOverlay {...props} />);

    expect(screen.getByText('search.songs')).toBeInTheDocument();
    expect(screen.getByText('Song Title 1')).toBeInTheDocument();
    expect(screen.getByText('Another Song')).toBeInTheDocument();
    expect(screen.getByText('Song Album 3')).toBeInTheDocument();

    // There should be two dividers because we have titles, artists, and albums
    const dividers = document.querySelectorAll('.search-cluster-divider');
    expect(dividers.length).toBe(2);
  });

  it('renders artist results correctly and allows selection', async () => {
    const user = userEvent.setup();
    const artist = { id: 'a1', name: 'Cool Artist', avatar: 'avatar.png' };

    const props = {
      ...defaultProps,
      query: 'Cool',
      results: {
        ...defaultProps.results,
        artists: [artist] as unknown as typeof defaultProps.results.artists,
      },
    };

    render(<SearchOverlay {...props} />);

    expect(screen.getAllByText('search.artists')[0]).toBeInTheDocument();
    expect(screen.getByText('Cool Artist')).toBeInTheDocument();

    // Click on artist
    const artistElement = screen.getByText('Cool Artist').closest('.search-item');
    await user.click(artistElement!);

    expect(props.onSelect).toHaveBeenCalledWith({ type: 'artist', item: artist });
  });

  it('renders album results correctly and allows selection', async () => {
    const user = userEvent.setup();
    const album = { id: 'al1', name: 'Cool Album', artist: 'Cool Artist', coverArt: 'cover.png' };

    const props = {
      ...defaultProps,
      query: 'Cool',
      results: {
        ...defaultProps.results,
        albums: [album] as unknown as typeof defaultProps.results.albums,
      },
    };

    render(<SearchOverlay {...props} />);

    expect(screen.getByText('search.albums')).toBeInTheDocument();
    expect(screen.getByText('Cool Album')).toBeInTheDocument();
    expect(screen.getByText('Cool Artist')).toBeInTheDocument();

    // Click on album
    const albumElement = screen.getByText('Cool Album').closest('.search-item');
    await user.click(albumElement!);

    expect(props.onSelect).toHaveBeenCalledWith({ type: 'album', item: album });
  });

  it('applies active class based on selectedIndex for albums', () => {
    const album = { id: 'al1', name: 'Cool Album', artist: 'Cool Artist' };

    const props = {
      ...defaultProps,
      query: 'Cool',
      selectedIndex: 0, // Should map to the first album if it's the only result
      results: {
        ...defaultProps.results,
        albums: [album] as unknown as typeof defaultProps.results.albums,
      },
    };

    render(<SearchOverlay {...props} />);

    const activeItem = document.querySelector('.search-item.active');
    expect(activeItem).toBeInTheDocument();
    expect(activeItem).toHaveTextContent('Cool Album');
  });

  it('triggers more menu for songs', async () => {
    const user = userEvent.setup();
    const song = { id: 's1', title: 'Song Title', artist: 'Artist' };

    vi.mocked(groupAndSortSongs).mockReturnValue({
      titles: [song as unknown as Song],
      artists: [],
      albums: [],
    });

    const props = {
      ...defaultProps,
      query: 'Song',
      results: { ...defaultProps.results, songs: [song] as unknown as Song[] },
    };

    render(<SearchOverlay {...props} />);

    const moreBtn = screen.getByRole('button', { name: /more/i, hidden: true }).closest('button') || screen.getByTestId('icon-more').closest('button');
    expect(moreBtn).toBeInTheDocument();

    await user.click(moreBtn!);

    // Check if the menu opens (it should render floating menu)
    expect(screen.getByText('playlist.playNext')).toBeInTheDocument();
    expect(screen.getByText('playlist.addToQueue')).toBeInTheDocument();
  });
});
