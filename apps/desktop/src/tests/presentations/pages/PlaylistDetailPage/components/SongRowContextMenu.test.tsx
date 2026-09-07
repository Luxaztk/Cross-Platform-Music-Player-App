// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SongRowContextMenu } from '../../../../../presentations/pages/PlaylistDetailPage/components/SongRowContextMenu';
import type { Song } from '@music/types';

vi.mock('@application/context/HotkeysContext', () => ({
  useHotkeysModal: () => ({
    openHotkeysModal: vi.fn(),
  }),
}));

describe('SongRowContextMenu', () => {
  const mockSong: Song = {
    id: 'song-1',
    filePath: '/path/song.mp3',
    title: 'Starboy',
    artist: 'The Weeknd',
    artists: ['The Weeknd'],
    album: 'Starboy',
    duration: 230,
    genre: 'R&B',
    year: 2016,
    coverArt: null,
    uploader: 'alex',
  };

  const defaultProps = {
    isVisible: true,
    song: mockSong,
    position: { top: 100, right: 100, placement: 'bottom' as const },
    activeSubMenuId: null,
    playlists: [],
    onPlay: vi.fn(),
    onPlayNext: vi.fn(),
    onAddToQueue: vi.fn(),
    onAddToPlaylist: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSetSubMenu: vi.fn(),
    t: vi.fn((key: string) => key),
    menuRef: { current: null },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isVisible is false or song is null', () => {
    const { container, rerender } = render(
      <SongRowContextMenu {...defaultProps} isVisible={false} />
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<SongRowContextMenu {...defaultProps} song={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders server permissions action when onEditPermissions is provided', async () => {
    const user = userEvent.setup();
    const onEditPermissions = vi.fn();

    render(
      <SongRowContextMenu
        {...defaultProps}
        onEditPermissions={onEditPermissions}
      />
    );

    const permissionAction = screen.getByText('settings.server.editPermissionsTitle');
    expect(permissionAction).toBeInTheDocument();

    await user.click(permissionAction);
    expect(onEditPermissions).toHaveBeenCalledTimes(1);
  });

  it('does not render server permissions action when onEditPermissions is omitted', () => {
    render(<SongRowContextMenu {...defaultProps} />);

    expect(screen.queryByText('settings.server.editPermissionsTitle')).not.toBeInTheDocument();
  });
});
