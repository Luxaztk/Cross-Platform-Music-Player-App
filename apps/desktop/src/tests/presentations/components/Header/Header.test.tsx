// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from '@components/Header/Header';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

const mockSetLanguage = vi.fn();
const mockSetTheme = vi.fn();
const mockSetLibraryFilter = vi.fn();
const mockHandleSyncLibrary = vi.fn().mockResolvedValue([]);
const mockHandleDeleteSongs = vi.fn().mockResolvedValue(true);
const mockShowNotification = vi.fn();
const mockPlayList = vi.fn();
const mockSetAudioDevice = vi.fn();
const mockAddSearch = vi.fn();

vi.mock('@hooks', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'en', setLanguage: mockSetLanguage }),
  useTheme: () => ({ theme: 'ocean', setTheme: mockSetTheme }),
  useLibrary: () => ({ 
    songs: [], playlists: [], 
    setLibraryFilter: mockSetLibraryFilter, 
    isSyncing: false,
    handleSyncLibrary: mockHandleSyncLibrary, 
    handleDeleteSongs: mockHandleDeleteSongs 
  }),
  useNotification: () => ({ showNotification: mockShowNotification }),
  useSearch: () => ({ songs: [], artists: [], albums: [] }),
  useRecentSearches: () => ({ recentSearches: [], addSearch: mockAddSearch, removeSearch: vi.fn(), clearAll: vi.fn() }),
  useDownload: vi.fn(() => ({
    url: '',
    setUrl: vi.fn(),
    downloadState: 'idle',
    fetchInfo: vi.fn(),
    executeDownload: vi.fn(),
  })),
}));

vi.mock('@music/hooks', () => ({
  usePlayer: () => ({ playList: mockPlayList, playNext: vi.fn(), addToQueue: vi.fn() }),
  useAudioDevices: () => ({ 
    devices: [{ deviceId: 'dev1', label: 'Speaker 1', groupId: 'g1', kind: 'audiooutput' as MediaDeviceKind }], 
    currentDeviceId: 'default', 
    setAudioDevice: mockSetAudioDevice 
  })
}));

window.electronAPI = {
  fetchYtInfo: vi.fn(),
  checkDuplicate: vi.fn(),
  downloadYtAudio: vi.fn(),
  writeAudioMetadata: vi.fn(),
  importFromPath: vi.fn(),
  openItemPath: vi.fn(),
  onDownloadProgress: vi.fn(() => vi.fn()),
  pickImage: vi.fn(),
} as any;

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
  };

  it('renders logo, home button, search bar, and profile button', () => {
    renderHeader();
    
    expect(screen.getByAltText('logo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('header.searchPlaceholder')).toBeInTheDocument();
  });

  it('navigates to home when logo or home button is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();
    
    const elements = screen.getAllByTitle('header.home');
    const logo = elements[0];
    await user.click(logo!);
    expect(mockNavigate).toHaveBeenCalledWith('/playlist/0');
    
    const homeBtn = elements[1];
    await user.click(homeBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/playlist/0');
  });

  it('opens and closes profile menu dropdown', async () => {
    const user = userEvent.setup();
    renderHeader();
    
    // Not found initially
    expect(screen.queryByText('header.language')).not.toBeInTheDocument();
    
    // Click profile
    const profileBtn = screen.getByTitle('header.profile');
    await user.click(profileBtn);
    
    expect(screen.getByText('header.language')).toBeInTheDocument();
    expect(screen.getByText('header.theme')).toBeInTheDocument();
    expect(screen.getByText('header.settings')).toBeInTheDocument();
    
    // Click again to close
    await user.click(profileBtn);
    await waitFor(() => {
      expect(screen.queryByText('header.language')).not.toBeInTheDocument();
    });
  });

  it('executes language toggle action', async () => {
    const user = userEvent.setup();
    renderHeader();
    
    await user.click(screen.getByTitle('header.profile'));
    
    // The language item has a toggle
    const langBtn = screen.getByText('header.language').closest('button');
    await user.click(langBtn!);
    
    expect(mockSetLanguage).toHaveBeenCalled();
  });

  it('navigates to settings page when clicking settings', async () => {
    const user = userEvent.setup();
    renderHeader();
    
    await user.click(screen.getByTitle('header.profile'));
    
    const settingsBtn = screen.getByText('header.settings').closest('button');
    await user.click(settingsBtn!);
    
    expect(mockNavigate).toHaveBeenCalledWith('/settingsPage');
  });

  it('handles scan missing files', async () => {
    const user = userEvent.setup();
    renderHeader();
    
    await user.click(screen.getByTitle('header.profile'));
    
    const scanBtn = screen.getByText('libraryCleanup.title').closest('button');
    await user.click(scanBtn!);
    
    expect(mockHandleSyncLibrary).toHaveBeenCalled();
  });

  it('handles search input change and shows overlay', async () => {
    const user = userEvent.setup();
    const { container } = renderHeader();
    
    const searchInput = screen.getByPlaceholderText('header.searchPlaceholder');
    await user.type(searchInput, 'hello');
    
    expect(searchInput).toHaveValue('hello');
    // Search overlay should appear since isSearchFocused is true
    // Because we mock useSearch with empty arrays, it will show some empty states or recent searches
    expect(container.querySelector('.search-overlay')).toBeInTheDocument();
    
    // Press escape to close
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(container.querySelector('.search-overlay')).not.toBeInTheDocument();
    });
  });
});
