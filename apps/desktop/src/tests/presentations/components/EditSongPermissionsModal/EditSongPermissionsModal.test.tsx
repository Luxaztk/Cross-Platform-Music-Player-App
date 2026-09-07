// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditSongPermissionsModal } from '@components/EditSongPermissionsModal';
import { ServerClient } from '@music/core';
import type { Song, ServerUserSummary } from '@music/types';

vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string, options?: Record<string, string | number>) => {
      if (options?.error) return `${key}: ${options.error}`;
      if (options?.uploader) return `bởi ${options.uploader}`;
      return key;
    },
  }),
}));

vi.mock('@music/core', () => ({
  ServerClient: {
    updateSongPermissions: vi.fn(),
  },
}));

describe('EditSongPermissionsModal', () => {
  const mockSong: Song = {
    id: 'song-123',
    filePath: '/path/to/song.mp3',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    artists: ['Queen'],
    album: 'A Night at the Opera',
    duration: 354,
    genre: 'Rock',
    year: 1975,
    coverArt: null,
    uploader: 'freddie',
    visibility: 'public',
    whitelist: ['brian', 'roger'],
  };

  const mockAvailableUsers: ServerUserSummary[] = [
    { username: 'brian', songCount: 5, publicCount: 3 },
    { username: 'roger', songCount: 8, publicCount: 4 },
    { username: 'john', songCount: 3, publicCount: 1 },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    song: mockSong,
    serverUrl: 'http://192.168.1.185:4545',
    auth: { username: 'freddie', token: 'token-abc' },
    availableUsers: mockAvailableUsers,
    onPermissionUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false or song is null', () => {
    const { container, rerender } = render(
      <EditSongPermissionsModal {...defaultProps} isOpen={false} />
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<EditSongPermissionsModal {...defaultProps} song={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders song info, uploader, and all 3 visibility choices', () => {
    render(<EditSongPermissionsModal {...defaultProps} />);

    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.getByText('Queen')).toBeInTheDocument();
    expect(screen.getByText('bởi freddie')).toBeInTheDocument();

    expect(screen.getByText('settings.server.visibilityPublic')).toBeInTheDocument();
    expect(screen.getByText('settings.server.visibilityWhitelist')).toBeInTheDocument();
    expect(screen.getByText('settings.server.visibilityPrivate')).toBeInTheDocument();
  });

  it('switches to whitelist visibility and displays WhitelistBadgeInput', async () => {
    const user = userEvent.setup();
    render(<EditSongPermissionsModal {...defaultProps} />);

    // Initially public, whitelist editor is not shown
    expect(screen.queryByPlaceholderText('settings.server.whitelistBadgePlaceholder')).not.toBeInTheDocument();

    // Click whitelist option
    const whitelistBtn = screen.getByText('settings.server.visibilityWhitelist').closest('button');
    expect(whitelistBtn).toBeInTheDocument();
    await user.click(whitelistBtn!);

    // Now WhitelistBadgeInput is rendered and contains existing whitelist badges
    expect(document.querySelector('.whitelist-search-input')).toBeInTheDocument();
    expect(screen.getByText('brian')).toBeInTheDocument();
    expect(screen.getByText('roger')).toBeInTheDocument();
  });

  it('calls ServerClient.updateSongPermissions on Save and triggers onPermissionUpdated', async () => {
    const user = userEvent.setup();
    vi.mocked(ServerClient.updateSongPermissions).mockResolvedValue({
      ok: true,
      song: { ...mockSong, visibility: 'private', whitelist: [] },
    });

    render(<EditSongPermissionsModal {...defaultProps} />);

    // Switch to private
    const privateBtn = screen.getByText('settings.server.visibilityPrivate').closest('button');
    await user.click(privateBtn!);

    // Click Save
    const saveBtn = screen.getByText('settings.server.savePermissions').closest('button');
    await user.click(saveBtn!);

    expect(ServerClient.updateSongPermissions).toHaveBeenCalledWith(
      'http://192.168.1.185:4545',
      'song-123',
      {
        visibility: 'private',
        whitelist: [],
      },
      { username: 'freddie', token: 'token-abc' }
    );

    await waitFor(() => {
      expect(defaultProps.onPermissionUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'song-123',
          visibility: 'private',
          whitelist: [],
        })
      );
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('displays error message when ServerClient.updateSongPermissions fails', async () => {
    const user = userEvent.setup();
    vi.mocked(ServerClient.updateSongPermissions).mockResolvedValue({
      ok: false,
      error: 'Permission denied by server',
    });

    render(<EditSongPermissionsModal {...defaultProps} />);

    const saveBtn = screen.getByText('settings.server.savePermissions').closest('button');
    await user.click(saveBtn!);

    await waitFor(() => {
      expect(screen.getByText('Permission denied by server')).toBeInTheDocument();
    });
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key press or close button click', async () => {
    const user = userEvent.setup();
    render(<EditSongPermissionsModal {...defaultProps} />);

    // Click close button
    const closeBtn = screen.getByLabelText('Close');
    await user.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    // Press Escape
    await user.keyboard('{Escape}');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
