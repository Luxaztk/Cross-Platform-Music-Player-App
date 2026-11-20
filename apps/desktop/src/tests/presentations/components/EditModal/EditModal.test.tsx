// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditModal } from '@components/EditModal';
import type { Song, Playlist } from '@music/types';

vi.mock('@hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks')>();
  return {
    ...actual,
    useLanguage: () => ({
      t: (key: string) => key
    }),
    useTheme: () => ({
      appIcon: 'default-app-icon.png'
    })
  };
});

vi.mock('@music/hooks', () => ({
  useLibraryContext: () => ({
    songs: [
      {
        id: 'library-song',
        title: 'Library Song',
        artist: 'Library Artist, Guest Artist',
        artists: ['Library Artist', 'Guest Artist'],
        album: 'Existing Album',
      },
      {
        id: 'canonical-library-song',
        title: 'Canonical Library Song',
        artist: 'BẰNG KIỀU, (S)TRONG Trọng Hiếu',
        artists: ['BẰNG KIỀU', '(S)TRONG Trọng Hiếu'],
        album: 'Existing Album',
      },
    ],
  }),
}));

window.electronAPI = {
  pickImage: vi.fn(),
} as unknown as typeof window.electronAPI;

describe('EditModal', () => {
  const mockPlaylist: Playlist = {
    id: 'p1', name: 'My Playlist', description: 'desc', songIds: [], createdAt: '0', thumbnail: ''
  };
  
  const mockSong: Song = {
    id: 's1', title: 'My Song', artist: 'Art', artists: ['Art'], album: 'Alb',
    duration: 100, filePath: '/f.mp3', hash: 'h', genre: 'Pop', year: 2021, coverArt: null
  };

  const defaultPropsPlaylist = {
    type: 'playlist' as const,
    data: mockPlaylist,
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  const defaultPropsSong = {
    type: 'song' as const,
    data: mockSong,
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false or data is null', () => {
    const { container, rerender } = render(<EditModal {...defaultPropsPlaylist} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
    
    rerender(<EditModal {...defaultPropsPlaylist} data={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly for playlist type', () => {
    render(<EditModal {...defaultPropsPlaylist} />);
    
    expect(screen.getByText('modal.editPlaylist')).toBeInTheDocument();
    
    // Inputs
    const nameInput = screen.getByDisplayValue('My Playlist');
    expect(nameInput).toBeInTheDocument();
    
    const descInput = screen.getByDisplayValue('desc');
    expect(descInput).toBeInTheDocument();
  });

  it('renders correctly for song type', () => {
    render(<EditModal {...defaultPropsSong} />);
    
    expect(screen.getByText('modal.editSong')).toBeInTheDocument();
    
    // Inputs
    expect(screen.getByDisplayValue('My Song')).toBeInTheDocument();
    expect(screen.getByText('Art')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'modal.songArtist' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alb')).toBeInTheDocument();
  });

  it('handles Save for Playlist', async () => {
    const user = userEvent.setup();
    render(<EditModal {...defaultPropsPlaylist} />);
    
    const nameInput = screen.getByPlaceholderText('modal.addName');
    const descInput = screen.getByPlaceholderText('modal.addDescription');
    
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Playlist');
    
    await user.clear(descInput);
    await user.type(descInput, 'Updated Desc');
    
    const saveBtn = screen.getByRole('button', { name: 'common.save' });
    await user.click(saveBtn);
    
    expect(defaultPropsPlaylist.onSave).toHaveBeenCalledTimes(1);
    expect(defaultPropsPlaylist.onSave).toHaveBeenCalledWith({
      ...mockPlaylist,
      name: 'Updated Playlist',
      description: 'Updated Desc',
      thumbnail: '',
    });
    expect(defaultPropsPlaylist.onClose).toHaveBeenCalledTimes(1);
  });

  it('handles Save for Song', async () => {
    const user = userEvent.setup();
    render(<EditModal {...defaultPropsSong} />);
    
    const titleInput = screen.getByPlaceholderText('modal.songTitle');
    const artistInput = screen.getByRole('combobox', { name: 'modal.songArtist' });
    
    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');
    
    await user.click(screen.getByRole('button', { name: 'modal.removeValue: Art' }));
    await user.type(artistInput, 'Art 1{Enter}');
    await user.type(artistInput, 'Art 2{Enter}');
    
    const saveBtn = screen.getByRole('button', { name: 'common.save' });
    await user.click(saveBtn);
    
    expect(defaultPropsSong.onSave).toHaveBeenCalledTimes(1);
    expect(defaultPropsSong.onSave).toHaveBeenCalledWith({
      ...mockSong,
      title: 'New Title',
      artist: 'Art 1, Art 2',
      artists: ['Art 1', 'Art 2'],
      album: 'Alb',
      coverArt: '',
    });
    expect(defaultPropsSong.onClose).toHaveBeenCalledTimes(1);
  });

  it('selects existing metadata and creates a new artist', async () => {
    const user = userEvent.setup();
    render(<EditModal {...defaultPropsSong} />);

    const artistInput = screen.getByRole('combobox', { name: 'modal.songArtist' });
    await user.click(artistInput);
    await user.type(artistInput, 'Library');
    await user.click(screen.getByRole('option', { name: 'Library Artist' }));
    await user.type(artistInput, 'New Artist{Enter}');

    const albumInput = screen.getByRole('combobox', { name: 'modal.songAlbum' });
    await user.clear(albumInput);
    await user.type(albumInput, 'Existing');
    await user.click(screen.getByRole('option', { name: 'Existing Album' }));

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(defaultPropsSong.onSave).toHaveBeenCalledWith({
      ...mockSong,
      artist: 'Art, Library Artist, New Artist',
      artists: ['Art', 'Library Artist', 'New Artist'],
      album: 'Existing Album',
      coverArt: '',
    });
  });

  it('keeps focus after selecting an artist and closes the result list on the first outside click', async () => {
    const user = userEvent.setup();
    render(<EditModal {...defaultPropsSong} />);

    const artistInput = screen.getByRole('combobox', { name: 'modal.songArtist' });
    await user.click(artistInput);
    await user.type(artistInput, 'Library');
    await user.click(screen.getByRole('option', { name: 'Library Artist' }));

    expect(artistInput).toHaveFocus();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByPlaceholderText('modal.songTitle'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('splits a newly entered artist credit into separate canonical artists', async () => {
    const user = userEvent.setup();
    render(<EditModal {...defaultPropsSong} />);

    await user.click(screen.getByRole('button', { name: 'modal.removeValue: Art' }));
    const artistInput = screen.getByRole('combobox', { name: 'modal.songArtist' });
    await user.type(artistInput, 'Bùi Công Nam, Anh Tú PROD. Zenkey{Enter}');

    expect(screen.getByText('Bùi Công Nam')).toBeInTheDocument();
    expect(screen.getByText('Anh Tú')).toBeInTheDocument();
    expect(screen.getByText('Zenkey')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'common.save' }));
    expect(defaultPropsSong.onSave).toHaveBeenCalledWith(expect.objectContaining({
      artist: 'Bùi Công Nam, Anh Tú, Zenkey',
      artists: ['Bùi Công Nam', 'Anh Tú', 'Zenkey'],
    }));
  });

  it('repairs stale artist fragments from a parenthesized producer credit', () => {
    const songWithStaleArtists: Song = {
      ...mockSong,
      artist: 'Emcee L x JGKiD x Đen (Prod. by Retro Hills)',
      artists: ['Emcee L', 'JGKiD', 'Đen (', 'by Retro Hills)'],
    };

    render(<EditModal {...defaultPropsSong} data={songWithStaleArtists} />);

    expect(screen.getByText('Emcee L')).toBeInTheDocument();
    expect(screen.getByText('JGKiD')).toBeInTheDocument();
    expect(screen.getByText('Đen')).toBeInTheDocument();
    expect(screen.getByText('Retro Hills')).toBeInTheDocument();
    expect(screen.queryByText('Đen (')).not.toBeInTheDocument();
    expect(screen.queryByText('by Retro Hills)')).not.toBeInTheDocument();
  });

  it('shows one option for each canonical artist alias', async () => {
    const user = userEvent.setup();
    render(<EditModal {...defaultPropsSong} />);

    const artistInput = screen.getByRole('combobox', { name: 'modal.songArtist' });
    await user.click(artistInput);

    expect(screen.getAllByRole('option', { name: 'Bằng Kiều' })).toHaveLength(1);
    expect(screen.getAllByRole('option', { name: '(S)TRONG' })).toHaveLength(1);
  });

  it('filters combo box options with the shared Vietnamese search utility', async () => {
    const user = userEvent.setup();
    render(<EditModal {...defaultPropsSong} />);

    const artistInput = screen.getByRole('combobox', { name: 'modal.songArtist' });
    await user.click(artistInput);
    await user.type(artistInput, 'bang kieu');

    expect(screen.getByRole('option', { name: 'Bằng Kiều' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '(S)TRONG' })).not.toBeInTheDocument();
  });

  it('commits a pending new artist when Save is clicked', async () => {
    const user = userEvent.setup();
    render(<EditModal {...defaultPropsSong} />);

    await user.type(
      screen.getByRole('combobox', { name: 'modal.songArtist' }),
      'Pending Artist'
    );
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(defaultPropsSong.onSave).toHaveBeenCalledWith(expect.objectContaining({
      artist: 'Art, Pending Artist',
      artists: ['Art', 'Pending Artist'],
    }));
  });

  it('disables save button when name or title is empty', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<EditModal {...defaultPropsPlaylist} />);
    
    const nameInput = screen.getByPlaceholderText('modal.addName');
    await user.clear(nameInput);
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
    
    rerender(<EditModal {...defaultPropsSong} />);
    const titleInput = screen.getByPlaceholderText('modal.songTitle');
    await user.clear(titleInput);
    expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
  });

  it('handles choose image correctly', async () => {
    const user = userEvent.setup();
    vi.mocked(window.electronAPI.pickImage).mockResolvedValueOnce('/new/image.jpg');
    
    render(<EditModal {...defaultPropsPlaylist} />);
    
    const imageOverlay = screen.getByText('modal.choosePhoto');
    await user.click(imageOverlay);
    
    await waitFor(() => {
      expect(window.electronAPI.pickImage).toHaveBeenCalledTimes(1);
    });
    
    // Save to assert it contains the new thumbnail path
    const saveBtn = screen.getByRole('button', { name: 'common.save' });
    await user.click(saveBtn);
    
    expect(defaultPropsPlaylist.onSave).toHaveBeenCalledWith(expect.objectContaining({
      thumbnail: '/new/image.jpg'
    }));
  });

  it('triggers onClose when close button, escape key or overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<EditModal {...defaultPropsPlaylist} />);
    
    const closeBtn = screen.getByRole('button', { name: 'common.close' });
    await user.click(closeBtn);
    expect(defaultPropsPlaylist.onClose).toHaveBeenCalledTimes(1);
    
    const overlay = container.querySelector('.modal-overlay');
    if (overlay) {
      await user.click(overlay);
    }
    expect(defaultPropsPlaylist.onClose).toHaveBeenCalledTimes(2);
    
    await user.keyboard('{Escape}');
    expect(defaultPropsPlaylist.onClose).toHaveBeenCalledTimes(3);
  });
});
