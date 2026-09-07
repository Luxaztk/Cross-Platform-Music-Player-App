import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerSection } from '../../../../../presentations/pages/SettingsPage/sections/ServerSection';
import { useSettings, useLanguage, useNotification } from '@hooks';
import { useLibraryContext } from '@music/hooks';
import { ServerClient } from '@music/core';
import { ServerUploadService } from '@infrastructure/services/ServerUploadService';
import type { Song } from '@music/types';

// Mock hooks
vi.mock('@hooks', () => ({
  useSettings: vi.fn(),
  useLanguage: vi.fn(),
  useNotification: vi.fn(),
}));

vi.mock('@music/hooks', () => ({
  useLibraryContext: vi.fn(),
}));

vi.mock('@music/core', () => ({
  ServerClient: {
    normalizeUrl: vi.fn((url: string) => url.trim().replace(/\/+$/, '')),
    checkHealth: vi.fn(),
    fetchSongs: vi.fn().mockResolvedValue({ ok: true, songs: [] }),
    fetchUsers: vi.fn().mockResolvedValue({ ok: true, users: [] }),
  },
}));

vi.mock('@infrastructure/services/ServerUploadService', () => ({
  ServerUploadService: {
    getInstance: vi.fn(),
  },
}));

vi.mock('@constants', () => ({
  ICON_SIZES: {
    SMALL: 16,
    MEDIUM: 24,
    LARGE: 32,
  },
}));

describe('ServerSection', () => {
  const mockUpdateSettings = vi.fn().mockResolvedValue(true);
  const mockShowNotification = vi.fn();
  const mockHandleAddSongs = vi.fn().mockResolvedValue({ count: 5 });
  const mockHandleDeleteSongs = vi.fn().mockResolvedValue(true);
  const mockPushSongs = vi.fn();
  const mockT = vi.fn((_key: string, options?: { defaultValue?: string }) => options?.defaultValue || _key);

  const mockLocalSongs: Song[] = [
    {
      id: 'local-1',
      filePath: 'C:\\Music\\song1.mp3',
      title: 'Local Song 1',
      artist: 'Artist 1',
      artists: ['Artist 1'],
      album: 'Album 1',
      duration: 210,
      genre: 'Pop',
      year: 2026,
      coverArt: null,
      sourceType: 'local',
    },
    {
      id: 'local-2',
      filePath: 'C:\\Music\\song2.flac',
      title: 'Local Song 2',
      artist: 'Artist 2',
      artists: ['Artist 2'],
      album: 'Album 2',
      duration: 180,
      genre: 'Rock',
      year: 2026,
      coverArt: null,
      sourceType: 'local',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLanguage).mockReturnValue({
      t: mockT,
    } as unknown as ReturnType<typeof useLanguage>);

    vi.mocked(useNotification).mockReturnValue({
      showNotification: mockShowNotification,
    } as unknown as ReturnType<typeof useNotification>);

    vi.mocked(useLibraryContext).mockReturnValue({
      handleAddSongs: mockHandleAddSongs,
      handleDeleteSongs: mockHandleDeleteSongs,
      songs: mockLocalSongs,
    } as unknown as ReturnType<typeof useLibraryContext>);

    vi.mocked(useSettings).mockReturnValue({
      settings: {
        server: {
          serverUrl: 'http://192.168.1.185:4545',
          autoConnect: false,
          autoPushOnDownload: true,
        },
      },
      updateSettings: mockUpdateSettings,
      isSaving: false,
    } as unknown as ReturnType<typeof useSettings>);

    mockPushSongs.mockResolvedValue({
      total: 2,
      uploadedCount: 2,
      skippedCount: 0,
      failedCount: 0,
      cancelled: false,
    });

    vi.mocked(ServerUploadService.getInstance).mockReturnValue({
      pushSongs: mockPushSongs,
    } as unknown as ReturnType<typeof ServerUploadService.getInstance>);

    vi.mocked(ServerClient.checkHealth).mockResolvedValue({
      ok: false,
      error: 'Not tested yet',
    });
  });

  it('renders section title, URL input, and connection button inside .settings-group', () => {
    const { container } = render(<ServerSection />);

    expect(screen.getByText('Máy Chủ Streaming (Homelab)')).toBeInTheDocument();
    const settingsGroup = container.querySelector('.settings-group');
    expect(settingsGroup).toBeInTheDocument();

    const input = screen.getByPlaceholderText('http://192.168.1.185:4545');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('http://192.168.1.185:4545');
    expect(screen.getByText('Kiểm tra kết nối')).toBeInTheDocument();
  });

  it('filters out when searchQuery does not match', () => {
    const { container } = render(<ServerSection searchQuery="bluetooth" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when searchQuery matches server title', () => {
    render(<ServerSection searchQuery="server" />);
    expect(screen.getByText('Máy Chủ Streaming (Homelab)')).toBeInTheDocument();
  });

  it('updates URL on change and saves on blur', async () => {
    const user = userEvent.setup();
    render(<ServerSection />);

    const input = screen.getByPlaceholderText('http://192.168.1.185:4545');
    await user.clear(input);
    await user.type(input, 'http://localhost:3001/');
    await user.tab(); // Trigger blur

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      server: {
        serverUrl: 'http://localhost:3001',
        autoConnect: false,
        autoPushOnDownload: true,
      },
    });
    expect(mockShowNotification).toHaveBeenCalledWith('success', 'Đã lưu cấu hình máy chủ');
  });

  it('handles successful connection check and displays health banner', async () => {
    const user = userEvent.setup();
    vi.mocked(ServerClient.checkHealth).mockResolvedValue({
      ok: true,
      health: {
        status: 'ok',
        service: 'melovista-streaming-server',
        version: '1.0.0',
        uptime: 120,
        totalSongs: 42,
        memoryUsage: { heapUsedMb: 5, rssMb: 10 },
        timestamp: Date.now(),
      },
    });

    render(<ServerSection />);

    const checkBtn = screen.getByText('Kiểm tra kết nối');
    await user.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText('Đã kết nối thành công tới máy chủ')).toBeInTheDocument();
    });

    expect(screen.getByText(/melovista-streaming-server v1.0.0/)).toBeInTheDocument();
    expect(screen.getAllByText(/42 bài hát/).length).toBeGreaterThanOrEqual(1);
  });

  it('handles connection check failure and displays error banner', async () => {
    const user = userEvent.setup();
    vi.mocked(ServerClient.checkHealth).mockResolvedValue({
      ok: false,
      error: 'Network connection refused',
    });

    render(<ServerSection />);

    const checkBtn = screen.getByText('Kiểm tra kết nối');
    await user.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText('Network connection refused')).toBeInTheDocument();
    });
    expect(screen.queryByText('Đã kết nối thành công tới máy chủ')).not.toBeInTheDocument();
  });

  it('syncs songs from server and imports into library', async () => {
    const user = userEvent.setup();
    const mockSongs: Song[] = [
      {
        id: 's1',
        filePath: 'http://192.168.1.185:4545/api/stream/s1',
        title: 'Server Track 1',
        artist: 'Homelab Artist',
        artists: ['Homelab Artist'],
        album: 'Homelab Album',
        duration: 180,
        genre: 'Electronic',
        year: 2026,
        coverArt: null,
        sourceType: 'stream',
        streamUrl: 'http://192.168.1.185:4545/api/stream/s1',
      },
    ];

    vi.mocked(ServerClient.fetchSongs).mockResolvedValueOnce({
      ok: true,
      songs: mockSongs,
    });

    render(<ServerSection />);

    const syncBtn = screen.getByText('Đồng bộ nhạc');
    await user.click(syncBtn);

    await waitFor(() => {
      expect(mockHandleAddSongs).toHaveBeenCalledWith(mockSongs);
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      'success',
      'Đã đồng bộ thành công 5 bài hát từ máy chủ!'
    );
  });

  it('triggers 1-click push to server and reports success', async () => {
    const user = userEvent.setup();
    render(<ServerSection />);

    const pushBtn = screen.getByRole('button', { name: /đẩy kho nhạc lên server/i });
    expect(pushBtn).toBeInTheDocument();
    await user.click(pushBtn);

    await waitFor(() => {
      expect(mockPushSongs).toHaveBeenCalledWith(
        'http://192.168.1.185:4545',
        mockLocalSongs,
        expect.any(Function),
        expect.any(Object),
        expect.objectContaining({ visibility: 'public' })
      );
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      'success',
      'Đã hoàn tất! Đẩy thành công 2 bài hát lên Server (Bỏ qua 0 bài đã có).'
    );
  });

  it('toggles autoPushOnDownload checkbox', async () => {
    const user = userEvent.setup();
    render(<ServerSection />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      server: {
        serverUrl: 'http://192.168.1.185:4545',
        autoConnect: false,
        autoPushOnDownload: false,
      },
    });
  });

  it('deduplicates songs when syncing from server and removes redundant stream duplicates', async () => {
    const user = userEvent.setup();
    const existingWithDuplicate: Song[] = [
      ...mockLocalSongs,
      {
        id: 'stream-dup-1',
        filePath: 'http://server/api/stream/dup1',
        title: 'Local Song 1',
        artist: 'Artist 1',
        artists: ['Artist 1'],
        album: 'Album 1',
        year: 2026,
        coverArt: null,
        duration: 210,
        genre: 'Pop',
        sourceType: 'stream',
      },
    ];

    vi.mocked(useLibraryContext).mockReturnValue({
      handleAddSongs: mockHandleAddSongs,
      handleDeleteSongs: mockHandleDeleteSongs,
      songs: existingWithDuplicate,
    } as unknown as ReturnType<typeof useLibraryContext>);

    // Server returns 1 matching song and 1 new song
    vi.mocked(ServerClient.fetchSongs).mockResolvedValueOnce({
      ok: true,
      songs: [
        {
          id: 'server-1',
          filePath: 'http://server/api/stream/server-1',
          title: 'Local Song 1', // matches local-1
          artist: 'Artist 1',
          artists: ['Artist 1'],
          album: 'Album 1',
          year: 2026,
          coverArt: null,
          duration: 210,
          genre: 'Pop',
          sourceType: 'stream',
        },
        {
          id: 'server-2',
          filePath: 'http://server/api/stream/server-2',
          title: 'Brand New Server Song',
          artist: 'New Artist',
          artists: ['New Artist'],
          album: 'New Album',
          year: 2026,
          coverArt: null,
          duration: 150,
          genre: 'Rock',
          sourceType: 'stream',
        },
      ],
    });

    render(<ServerSection />);

    const syncBtn = screen.getByText('Đồng bộ nhạc');
    await user.click(syncBtn);

    await waitFor(() => {
      expect(mockHandleDeleteSongs).toHaveBeenCalledWith(['stream-dup-1']);
      expect(mockHandleAddSongs).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'server-2', title: 'Brand New Server Song' }),
      ]);
    });
  });

  it('updates username on blur and persists to settings', async () => {
    const user = userEvent.setup();
    render(<ServerSection />);

    const usernameInput = screen.getByPlaceholderText(/Nhập tên của bạn/i);
    await user.clear(usernameInput);
    await user.type(usernameInput, 'alex_gamer');
    await user.tab(); // triggers onBlur

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      server: {
        serverUrl: 'http://192.168.1.185:4545',
        autoConnect: false,
        autoPushOnDownload: true,
        username: 'alex_gamer',
      },
    });
  });

  it('switches visibility mode to whitelist and renders whitelist input', async () => {
    vi.mocked(ServerClient.fetchUsers).mockResolvedValue({
      ok: true,
      users: [
        { username: 'alex', songCount: 5, publicCount: 3 },
        { username: 'shadow', songCount: 12, publicCount: 8 },
      ],
    });

    const user = userEvent.setup();
    render(<ServerSection />);

    // Open visibility dropdown
    const dropdownTrigger = screen.getByRole('button', { name: /Công khai/i });
    await user.click(dropdownTrigger);

    // Select whitelist option
    const whitelistOption = screen.getByRole('option', { name: /Chỉ định bạn bè/i });
    await user.click(whitelistOption);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      server: {
        serverUrl: 'http://192.168.1.185:4545',
        autoConnect: false,
        autoPushOnDownload: true,
        defaultVisibility: 'whitelist',
      },
    });

    // Whitelist input should now be visible
    const whitelistInput = screen.getByPlaceholderText(/Tìm hoặc nhập tên bạn bè/i);
    expect(whitelistInput).toBeInTheDocument();

    // Type to search for user
    await user.type(whitelistInput, 'al');

    // Suggestion for alex should appear
    const alexOption = await screen.findByRole('option', { name: /alex/i });
    expect(alexOption).toBeInTheDocument();
    await user.click(alexOption);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      server: {
        serverUrl: 'http://192.168.1.185:4545',
        autoConnect: false,
        autoPushOnDownload: true,
        defaultWhitelist: ['alex'],
      },
    });

    // Alex should be displayed as a badge
    expect(screen.getByTestId('badge-alex')).toBeInTheDocument();

    // Type a custom user not on server and press Enter
    await user.type(whitelistInput, 'gamer99{enter}');

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      server: {
        serverUrl: 'http://192.168.1.185:4545',
        autoConnect: false,
        autoPushOnDownload: true,
        defaultWhitelist: ['alex', 'gamer99'],
      },
    });
    expect(screen.getByTestId('badge-gamer99')).toBeInTheDocument();

    // Delete badge alex
    const deleteAlexBtn = screen.getByLabelText('Remove alex');
    await user.click(deleteAlexBtn);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      server: {
        serverUrl: 'http://192.168.1.185:4545',
        autoConnect: false,
        autoPushOnDownload: true,
        defaultWhitelist: ['gamer99'],
      },
    });
    expect(screen.queryByTestId('badge-alex')).not.toBeInTheDocument();
  });

  it('opens server browser modal when browse button is clicked', async () => {
    const user = userEvent.setup();
    render(<ServerSection />);

    const browseBtn = screen.getByRole('button', { name: /Duyệt & Chọn Lọc/i });
    await user.click(browseBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Kho Nhạc Máy Chủ Homelab')).toBeInTheDocument();
  });
});
