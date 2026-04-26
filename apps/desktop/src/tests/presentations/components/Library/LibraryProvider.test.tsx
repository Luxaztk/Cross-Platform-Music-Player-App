// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LibraryProvider } from '@components/Library/LibraryProvider';
import { useLibrary } from '@hooks'; // Assuming useLibrary is exported from @hooks or @music/hooks

// Mock electronAPI for ElectronLibraryRepository
window.electronAPI = {
  getLibrary: vi.fn().mockResolvedValue({ songs: [{ id: 's1', title: 'Test Song' }], playlists: [] }),
  getPlaylists: vi.fn().mockResolvedValue([{ id: 'p1', name: 'Test Playlist' }]),
  scanMissingFiles: vi.fn().mockResolvedValue(['missing1']),
  addSongs: vi.fn(),
  updateSong: vi.fn(),
  deleteSongs: vi.fn(),
  createPlaylist: vi.fn(),
  updatePlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  addSongsToPlaylist: vi.fn(),
  removeSongsFromPlaylist: vi.fn(),
  updateLibraryFilter: vi.fn(),
  getLibraryFilter: vi.fn().mockResolvedValue(null),
  onLibraryUpdate: vi.fn(() => vi.fn()),
  onImportProgress: vi.fn(() => vi.fn()),
  onScanProgress: vi.fn(() => vi.fn()),
} as any;

// A test component to consume the provided Context
const TestConsumer = () => {
  const { songs, handleScanMissingFiles } = useLibrary();

  return (
    <div>
      <div data-testid="songs-count">{songs.length}</div>
      <button onClick={() => handleScanMissingFiles()}>Scan Missing</button>
    </div>
  );
};

describe('LibraryProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children and provides library context using ElectronRepository', async () => {
    render(
      <LibraryProvider>
        <TestConsumer />
      </LibraryProvider>
    );

    // Initial load fetches library via ElectronLibraryRepository
    await waitFor(() => {
      expect(window.electronAPI.getLibrary).toHaveBeenCalled();
    });

    // The mock returns 1 song, so the consumer should render 1
    await waitFor(() => {
      expect(screen.getByTestId('songs-count')).toHaveTextContent('1');
    });
  });

  it('allows consumers to trigger repository actions', async () => {
    const user = userEvent.setup();

    render(
      <LibraryProvider>
        <TestConsumer />
      </LibraryProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('songs-count')).toHaveTextContent('1');
    });

    const scanBtn = screen.getByRole('button', { name: 'Scan Missing' });
    await user.click(scanBtn);

    // This should trigger window.electronAPI.scanMissingFiles
    await waitFor(() => {
      expect(window.electronAPI.scanMissingFiles).toHaveBeenCalled();
    });
  });
});
