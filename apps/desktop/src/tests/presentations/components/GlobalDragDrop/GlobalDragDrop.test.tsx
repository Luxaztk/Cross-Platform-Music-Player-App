import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GlobalDragDrop } from '../../../../presentations/components/GlobalDragDrop/GlobalDragDrop';
import { useLocation } from 'react-router-dom';
import { useLibraryContext } from '@music/hooks';
import { useNotification, useLanguage } from '../../../../application/hooks';

vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(),
}));

vi.mock('@music/hooks', () => ({
  useLibraryContext: vi.fn(),
}));

vi.mock('../../../../application/hooks', () => ({
  useNotification: vi.fn(),
  useLanguage: vi.fn(),
}));

describe('GlobalDragDrop', () => {
  let mockHandleRunAutoImportScan: ReturnType<typeof vi.fn>;
  let mockHandleAddSongsToPlaylist: ReturnType<typeof vi.fn>;
  let mockHandleGetPlaylistDetail: ReturnType<typeof vi.fn>;
  let mockShowNotification: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHandleRunAutoImportScan = vi.fn().mockResolvedValue({ added: 0, migrated: 0, details: [] });
    mockHandleAddSongsToPlaylist = vi.fn().mockResolvedValue(true);
    mockHandleGetPlaylistDetail = vi.fn().mockResolvedValue(undefined);
    mockShowNotification = vi.fn();

    vi.mocked(useLocation).mockReturnValue({ pathname: '/' } as unknown as ReturnType<typeof useLocation>);
    
    vi.mocked(useLanguage).mockReturnValue({
      t: vi.fn((key: string, options?: unknown) => key + (options ? `_${JSON.stringify(options)}` : '')),
    } as unknown as ReturnType<typeof useLanguage>);

    vi.mocked(useNotification).mockReturnValue({
      showNotification: mockShowNotification,
    } as unknown as ReturnType<typeof useNotification>);

    vi.mocked(useLibraryContext).mockReturnValue({
      handleRunAutoImportScan: mockHandleRunAutoImportScan,
      handleAddSongsToPlaylist: mockHandleAddSongsToPlaylist,
      handleGetPlaylistDetail: mockHandleGetPlaylistDetail,
    } as unknown as ReturnType<typeof useLibraryContext>);

    (window as unknown as { electronAPI: any }).electronAPI = {
      getPathForFile: vi.fn((file: File) => file.name),
    };
  });

  afterEach(() => {
    delete (window as unknown as { electronAPI: any }).electronAPI;
  });

  const fireDragEvent = (type: string, dataTransfer: unknown = null) => {
    const event = new Event(type) as unknown as Event;
    if (dataTransfer) {
      (event as any).dataTransfer = dataTransfer;
    }
    window.dispatchEvent(event);
  };

  it('renders nothing initially', () => {
    const { container } = render(<GlobalDragDrop />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders overlay when dragging items over', () => {
    render(<GlobalDragDrop />);
    
    act(() => {
      fireDragEvent('dragenter', { items: [{ kind: 'file' }] });
    });

    expect(screen.getByText('playlist.emptyStateTitle')).toBeInTheDocument();
    expect(screen.getByText('Kéo thả thư mục nhạc của bạn vào đây để bắt đầu')).toBeInTheDocument();
  });

  it('hides overlay when dragging leaves', () => {
    render(<GlobalDragDrop />);
    
    act(() => {
      fireDragEvent('dragenter', { items: [{ kind: 'file' }] });
    });
    expect(screen.getByText('playlist.emptyStateTitle')).toBeInTheDocument();

    act(() => {
      fireDragEvent('dragleave');
    });
    expect(screen.queryByText('playlist.emptyStateTitle')).not.toBeInTheDocument();
  });

  it('handles dragover without issues', () => {
    render(<GlobalDragDrop />);
    act(() => {
      fireDragEvent('dragover');
    });
    // Should just preventDefault without rendering overlay
    expect(screen.queryByText('playlist.emptyStateTitle')).not.toBeInTheDocument();
  });

  it('processes dropped files for library route', async () => {
    mockHandleRunAutoImportScan.mockResolvedValue({ added: 2, migrated: 1, details: [{ id: '1' }] });
    render(<GlobalDragDrop />);
    
    act(() => {
      fireDragEvent('dragenter', { items: [{ kind: 'file' }] });
    });

    const file = new File([''], 'song.mp3');
    await act(async () => {
      fireDragEvent('drop', { files: [file] });
    });

    expect(mockHandleRunAutoImportScan).toHaveBeenCalledWith(['song.mp3']);
    expect(mockHandleAddSongsToPlaylist).not.toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalledWith('success', 'playlist.importSuccess_singleFile_{"count":3}');
  });

  it('processes dropped files for specific playlist route', async () => {
    vi.mocked(useLocation).mockReturnValue({ pathname: '/playlist/p123' } as unknown as ReturnType<typeof useLocation>);
    mockHandleRunAutoImportScan.mockResolvedValue({ added: 2, migrated: 0, details: [{ id: '1' }, { id: '2' }] });
    
    render(<GlobalDragDrop />);
    
    act(() => {
      fireDragEvent('dragenter', { items: [{ kind: 'file' }] });
    });

    const file1 = new File([''], 'song1.mp3');
    const file2 = new File([''], 'song2.mp3');
    
    await act(async () => {
      fireDragEvent('drop', { files: [file1, file2] });
    });

    expect(mockHandleRunAutoImportScan).toHaveBeenCalledWith(['song1.mp3', 'song2.mp3']);
    expect(mockHandleAddSongsToPlaylist).toHaveBeenCalledWith('p123', [{ id: '1' }, { id: '2' }]);
    expect(mockHandleGetPlaylistDetail).toHaveBeenCalledWith('p123');
    expect(mockShowNotification).toHaveBeenCalledWith('success', 'playlist.importSuccess_multiFile_{"count":2}');
    expect(mockShowNotification).toHaveBeenCalledWith('success', 'playlist.addSongsSuccess_{"count":2,"name":"Playlist"}');
  });

  it('handles drop with no files', async () => {
    render(<GlobalDragDrop />);
    
    act(() => {
      fireDragEvent('dragenter', { items: [{ kind: 'file' }] });
    });

    await act(async () => {
      fireDragEvent('drop', { files: [] });
    });

    expect(mockHandleRunAutoImportScan).not.toHaveBeenCalled();
    expect(screen.queryByText('playlist.emptyStateTitle')).not.toBeInTheDocument();
  });

  it('handles drop errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockHandleRunAutoImportScan.mockRejectedValue(new Error('Import failed'));
    
    render(<GlobalDragDrop />);
    
    act(() => {
      fireDragEvent('dragenter', { items: [{ kind: 'file' }] });
    });

    const file = new File([''], 'song.mp3');
    await act(async () => {
      fireDragEvent('drop', { files: [file] });
    });

    expect(mockHandleRunAutoImportScan).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('[GlobalDragDrop] Error importing files:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });
});
