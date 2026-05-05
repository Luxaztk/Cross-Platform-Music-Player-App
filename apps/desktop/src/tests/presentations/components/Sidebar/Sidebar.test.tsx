// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Sidebar } from '../../../../presentations/components/Sidebar';

import { useLibraryContext } from '@music/hooks';
import { useLanguage, useTheme } from '@hooks';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@music/hooks', () => ({
  useLibraryContext: vi.fn(),
}));

vi.mock('@hooks', () => ({
  useLanguage: vi.fn(),
  useTheme: vi.fn(),
  useLocalFilter: vi.fn((items, query) => {
    const filtered = !query ? items : items.filter((item: any) => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    return [filtered, false];
  }),

}));

vi.mock('../../../../presentations/components/EditModal', () => ({
  EditModal: ({ isOpen, onClose, onSave }: any) => 
    isOpen ? <div data-testid="edit-modal"><button onClick={() => onSave({ name: 'Updated' })}>Save</button><button onClick={onClose}>Close</button></div> : null,
}));

vi.mock('../../../../presentations/components/DeleteConfirmationModal', () => ({
  DeleteConfirmationModal: ({ isOpen, onConfirm, onClose }: any) => 
    isOpen ? <div data-testid="delete-modal"><button onClick={onConfirm}>Confirm</button><button onClick={onClose}>Cancel</button></div> : null,
}));


describe('Sidebar', () => {
  const mockOnToggle = vi.fn();
  const mockHandleCreatePlaylist = vi.fn();
  const mockHandleDeletePlaylist = vi.fn();
  const mockHandleUpdatePlaylist = vi.fn();
  const mockHandleImportFiles = vi.fn();
  const mockHandleImportFolder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLanguage).mockReturnValue({
      t: (key: string) => key,
    } as unknown as ReturnType<typeof useLanguage>);

    vi.mocked(useTheme).mockReturnValue({
      appIcon: 'test-icon.png',
    } as unknown as ReturnType<typeof useTheme>);

    vi.mocked(useLibraryContext).mockReturnValue({
      playlists: [
        { id: '0', name: 'All Songs' },
        { id: '1', name: 'My Playlist 1' },
        { id: '2', name: 'My Playlist 2' },
      ],
      handleCreatePlaylist: mockHandleCreatePlaylist,
      handleDeletePlaylist: mockHandleDeletePlaylist,
      handleUpdatePlaylist: mockHandleUpdatePlaylist,
      handleImportFiles: mockHandleImportFiles,
      handleImportFolder: mockHandleImportFolder,
    } as unknown as ReturnType<typeof useLibraryContext>);
  });

  const renderSidebar = (isCollapsed = false) => {
    return render(
      <BrowserRouter>
        <Sidebar isCollapsed={isCollapsed} onToggle={mockOnToggle} />
      </BrowserRouter>
    );
  };

  it('renders correctly when expanded', () => {
    renderSidebar();
    expect(screen.getByText('sidebar.yourLibrary')).toBeInTheDocument();
    expect(screen.getByText('sidebar.allSongs')).toBeInTheDocument();
    expect(screen.getByText('My Playlist 1')).toBeInTheDocument();
    expect(screen.getByText('My Playlist 2')).toBeInTheDocument();
  });

  it('renders correctly when collapsed', () => {
    renderSidebar(true);
    expect(screen.queryByText('sidebar.yourLibrary')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3); // All Songs + 2 playlists
  });

  it('calls onToggle when toggle button is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();
    
    await user.click(screen.getByTitle('sidebar.collapse'));
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('handles playlist creation', async () => {
    const user = userEvent.setup();
    mockHandleCreatePlaylist.mockResolvedValue({ id: '3', name: 'New Playlist' });
    renderSidebar();
    
    await user.click(screen.getByTitle('sidebar.createPlaylist'));
    expect(mockHandleCreatePlaylist).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/playlist/3');
    });
  });

  it('filters playlists based on search', async () => {
    const user = userEvent.setup();
    renderSidebar();
    
    const searchBtn = screen.getByTitle('header.searchPlaceholder');
    await user.click(searchBtn);
    
    const input = screen.getByPlaceholderText('header.searchPlaceholder');
    await user.type(input, 'Playlist 1');
    
    expect(screen.getByText('My Playlist 1')).toBeInTheDocument();
    expect(screen.queryByText('My Playlist 2')).not.toBeInTheDocument();
  });

  it('handles playlist deletion', async () => {
    const user = userEvent.setup();
    renderSidebar();
    
    // Open more menu for Playlist 1
    const moreBtns = screen.getAllByTitle('common.more');
    await user.click(moreBtns[1]); // Index 0 is Library, 1 is Playlist 1
    
    const deleteBtn = screen.getByText('common.delete');
    await user.click(deleteBtn);
    
    expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    
    await user.click(screen.getByText('Confirm'));
    expect(mockHandleDeletePlaylist).toHaveBeenCalledWith('1');
  });

  it('handles playlist editing', async () => {
    const user = userEvent.setup();
    renderSidebar();
    
    // Open more menu for Playlist 1
    const moreBtns = screen.getAllByTitle('common.more');
    await user.click(moreBtns[1]);
    
    const editBtn = screen.getByText('common.edit');
    await user.click(editBtn);
    
    expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    
    await user.click(screen.getByText('Save'));
    expect(mockHandleUpdatePlaylist).toHaveBeenCalled();
  });
});
