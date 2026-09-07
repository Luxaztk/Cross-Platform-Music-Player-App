import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerLibraryBrowserModal } from '../../../../../presentations/pages/SettingsPage/components/ServerLibraryBrowserModal';
import { useLanguage } from '@hooks';
import { ServerClient } from '@music/core';
import type { Song, ServerUserSummary } from '@music/types';

vi.mock('@hooks', () => ({
  useLanguage: vi.fn(),
}));

vi.mock('@music/core', () => ({
  ServerClient: {
    normalizeUrl: vi.fn((url: string) => url.trim().replace(/\/+$/, '')),
    fetchSongs: vi.fn(),
    fetchUsers: vi.fn(),
  },
}));

vi.mock('@constants', () => ({
  ICON_SIZES: {
    SMALL: 16,
    MEDIUM: 24,
    LARGE: 32,
  },
}));

describe('ServerLibraryBrowserModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSyncSongs = vi.fn().mockResolvedValue(undefined);
  const mockT = vi.fn((_key: string, options?: { defaultValue?: string; count?: number }) => {
    if (options?.count !== undefined && options?.defaultValue) {
      return options.defaultValue.replace('{count}', String(options.count));
    }
    return options?.defaultValue || _key;
  });

  const mockServerSongs: Song[] = [
    {
      id: 'srv-1',
      title: 'Neon Nights',
      artist: 'Retro Wave',
      artists: ['Retro Wave'],
      album: 'Synth City',
      duration: 215,
      genre: 'Synthwave',
      year: 2025,
      coverArt: null,
      sourceType: 'stream',
      filePath: 'http://192.168.1.185:4545/api/stream/srv-1',
      uploader: 'gamer_pro',
      visibility: 'public',
      hash: 'hash-111',
    },
    {
      id: 'srv-2',
      title: 'Midnight Jazz',
      artist: 'Miles Blue',
      artists: ['Miles Blue'],
      album: 'Night Sessions',
      duration: 180,
      genre: 'Jazz',
      year: 2024,
      coverArt: null,
      sourceType: 'stream',
      filePath: 'http://192.168.1.185:4545/api/stream/srv-2',
      uploader: 'jazz_lover',
      visibility: 'whitelist',
      whitelist: ['luxaztk'],
      hash: 'hash-222',
    },
    {
      id: 'srv-3',
      title: 'Secret Track',
      artist: 'Shadow',
      artists: ['Shadow'],
      album: 'Classified',
      duration: 120,
      genre: 'Ambient',
      year: 2026,
      coverArt: null,
      sourceType: 'stream',
      filePath: 'http://192.168.1.185:4545/api/stream/srv-3',
      uploader: 'luxaztk',
      visibility: 'private',
      hash: 'hash-333',
    },
  ];

  const mockUsers: ServerUserSummary[] = [
    { username: 'gamer_pro', songCount: 1, publicCount: 1 },
    { username: 'jazz_lover', songCount: 1, publicCount: 0 },
    { username: 'luxaztk', songCount: 1, publicCount: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLanguage).mockReturnValue({
      t: mockT,
    } as unknown as ReturnType<typeof useLanguage>);

    vi.mocked(ServerClient.fetchSongs).mockResolvedValue({
      ok: true,
      songs: mockServerSongs,
    });

    vi.mocked(ServerClient.fetchUsers).mockResolvedValue({
      ok: true,
      users: mockUsers,
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ServerLibraryBrowserModal
        isOpen={false}
        onClose={mockOnClose}
        serverUrl="http://192.168.1.185:4545"
        existingSongs={[]}
        onSyncSongs={mockOnSyncSongs}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('fetches and renders songs and uploaders when opened', async () => {
    render(
      <ServerLibraryBrowserModal
        isOpen={true}
        onClose={mockOnClose}
        serverUrl="http://192.168.1.185:4545"
        clientUsername="luxaztk"
        existingSongs={[]}
        onSyncSongs={mockOnSyncSongs}
      />
    );

    expect(ServerClient.fetchSongs).toHaveBeenCalledWith('http://192.168.1.185:4545', {
      username: 'luxaztk',
      token: undefined,
    });
    expect(ServerClient.fetchUsers).toHaveBeenCalledWith('http://192.168.1.185:4545', {
      username: 'luxaztk',
      token: undefined,
    });

    await waitFor(() => {
      expect(screen.getByText('Neon Nights')).toBeInTheDocument();
      expect(screen.getByText('Midnight Jazz')).toBeInTheDocument();
      expect(screen.getByText('Secret Track')).toBeInTheDocument();
    });

    // Check uploader chips
    expect(screen.getByRole('button', { name: /gamer_pro/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /jazz_lover/i })).toBeInTheDocument();
  });

  it('filters songs by uploader filter chip', async () => {
    const user = userEvent.setup();

    render(
      <ServerLibraryBrowserModal
        isOpen={true}
        onClose={mockOnClose}
        serverUrl="http://192.168.1.185:4545"
        clientUsername="luxaztk"
        existingSongs={[]}
        onSyncSongs={mockOnSyncSongs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Neon Nights')).toBeInTheDocument();
    });

    // Click on 'jazz_lover' uploader chip
    const jazzLoverChip = screen.getByRole('button', { name: /jazz_lover/i });
    await user.click(jazzLoverChip);

    // Only Midnight Jazz should remain visible
    expect(screen.getByText('Midnight Jazz')).toBeInTheDocument();
    expect(screen.queryByText('Neon Nights')).not.toBeInTheDocument();
    expect(screen.queryByText('Secret Track')).not.toBeInTheDocument();
  });

  it('filters songs by text search query', async () => {
    const user = userEvent.setup();

    render(
      <ServerLibraryBrowserModal
        isOpen={true}
        onClose={mockOnClose}
        serverUrl="http://192.168.1.185:4545"
        existingSongs={[]}
        onSyncSongs={mockOnSyncSongs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Neon Nights')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm bài hát trên máy chủ/i);
    await user.type(searchInput, 'Miles');

    expect(screen.getByText('Midnight Jazz')).toBeInTheDocument();
    expect(screen.queryByText('Neon Nights')).not.toBeInTheDocument();
  });

  it('selects songs and invokes onSyncSongs when sync button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ServerLibraryBrowserModal
        isOpen={true}
        onClose={mockOnClose}
        serverUrl="http://192.168.1.185:4545"
        existingSongs={[]}
        onSyncSongs={mockOnSyncSongs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Neon Nights')).toBeInTheDocument();
    });

    // Click on the row for 'Neon Nights' to select it
    const row = screen.getByText('Neon Nights').closest('.browser-song-row')!;
    expect(row).toBeInTheDocument();
    await user.click(row);

    // Verify sync button shows 1 selected
    const syncBtn = screen.getByRole('button', { name: /Đồng bộ 1 bài/i });
    expect(syncBtn).toBeEnabled();

    // Click sync
    await user.click(syncBtn);

    expect(mockOnSyncSongs).toHaveBeenCalledWith([mockServerSongs[0]]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('select all and deselect all songs', async () => {
    const user = userEvent.setup();

    render(
      <ServerLibraryBrowserModal
        isOpen={true}
        onClose={mockOnClose}
        serverUrl="http://192.168.1.185:4545"
        existingSongs={[]}
        onSyncSongs={mockOnSyncSongs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Neon Nights')).toBeInTheDocument();
    });

    const selectAllBtn = screen.getByRole('button', { name: /Chọn tất cả/i });
    await user.click(selectAllBtn);

    const syncBtn = screen.getByRole('button', { name: /Đồng bộ 3 bài/i });
    expect(syncBtn).toBeEnabled();

    // Click deselect all
    const deselectBtn = screen.getByRole('button', { name: /Bỏ chọn/i });
    await user.click(deselectBtn);

    expect(screen.getByRole('button', { name: /Đồng bộ 0 bài/i })).toBeDisabled();
  });

  it('marks songs as already in library when existingSongs matches', async () => {
    const existingSongs: Song[] = [
      {
        id: 'local-1',
        title: 'Neon Nights',
        artist: 'Retro Wave',
        artists: ['Retro Wave'],
        album: 'Synth City',
        duration: 215,
        genre: 'Synthwave',
        year: 2025,
        coverArt: null,
        sourceType: 'local',
        filePath: 'C:\\Music\\neon_nights.mp3',
        hash: 'hash-111',
      },
    ];

    render(
      <ServerLibraryBrowserModal
        isOpen={true}
        onClose={mockOnClose}
        serverUrl="http://192.168.1.185:4545"
        existingSongs={existingSongs}
        onSyncSongs={mockOnSyncSongs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Neon Nights')).toBeInTheDocument();
    });

    // The row for Neon Nights should display 'Đã có' badge
    const row = screen.getByText('Neon Nights').closest('.browser-song-row')!;
    expect(row).toBeInTheDocument();
    expect(screen.getByText('Đã có')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ServerLibraryBrowserModal
        isOpen={true}
        onClose={mockOnClose}
        serverUrl="http://192.168.1.185:4545"
        existingSongs={[]}
        onSyncSongs={mockOnSyncSongs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Neon Nights')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /close/i });
    await user.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows edit permissions button for owned song and opens EditSongPermissionsModal', async () => {
    const user = userEvent.setup();

    render(
      <ServerLibraryBrowserModal
        isOpen={true}
        onClose={mockOnClose}
        serverUrl="http://192.168.1.185:4545"
        clientUsername="luxaztk"
        existingSongs={[]}
        onSyncSongs={mockOnSyncSongs}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Secret Track')).toBeInTheDocument();
    });

    // Row for Secret Track is owned by luxaztk, should have edit button
    const editBtn = screen.getByRole('button', { name: 'Sửa quyền' });
    expect(editBtn).toBeInTheDocument();

    await user.click(editBtn);

    // Permissions modal is opened
    expect(screen.getByRole('dialog', { name: 'Quyền Chia Sẻ Bài Hát' })).toBeInTheDocument();
  });
});
