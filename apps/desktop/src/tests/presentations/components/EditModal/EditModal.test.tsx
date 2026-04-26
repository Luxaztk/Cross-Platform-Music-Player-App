// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditModal } from '@components/EditModal';
import type { Song, Playlist } from '@music/types';

vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string) => key
  }),
  useTheme: () => ({
    appIcon: 'default-app-icon.png'
  })
}));

vi.mock('@music/utils', () => ({
  splitArtists: vi.fn((artistStr: string) => artistStr.split(',').map(a => a.trim()))
}));

window.electronAPI = {
  pickImage: vi.fn(),
} as any;

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
    expect(screen.getByDisplayValue('Art')).toBeInTheDocument();
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
    const artistInput = screen.getByPlaceholderText('modal.songArtist');
    
    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');
    
    await user.clear(artistInput);
    await user.type(artistInput, 'Art 1, Art 2');
    
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
