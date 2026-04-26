// @vitest-environment jsdom
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DownloaderModal } from '@components/DownloaderModal';


// Mock hooks
vi.mock('@hooks', () => ({
  useLanguage: () => ({
    t: (key: string) => key
  }),
  useLibrary: () => ({
    refreshLibrary: vi.fn(),
    refreshPlaylists: vi.fn()
  }),
  useNotification: () => ({
    showNotification: vi.fn()
  })
}));

// Provide basic mock for EditModal to avoid complex dependencies, but if rule says NO internal component mocking, 
// wait, EditModal might need its own complex context. The rules: "DO NOT mock internal child components. Let the component render fully."
// I will not mock EditModal.

window.electronAPI = {
  fetchYtInfo: vi.fn(),
  checkDuplicate: vi.fn(),
  downloadYtAudio: vi.fn(),
  writeAudioMetadata: vi.fn(),
  importFromPath: vi.fn(),
  openItemPath: vi.fn(),
  onDownloadProgress: vi.fn(() => vi.fn()),
} as any;

describe('DownloaderModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  const mockReadText = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { readText: mockReadText },
      writable: true,
      configurable: true
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<DownloaderModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders initial input state correctly', () => {
    render(<DownloaderModal {...defaultProps} />);
    expect(screen.getByText('downloader.title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://www.youtube.com/watch?v=...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'downloader.fetchInfo' })).toBeDisabled();
  });

  it('enables fetch button when URL is entered', async () => {
    const user = userEvent.setup();
    render(<DownloaderModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
    await user.type(input, 'https://youtube.com/watch?v=123');
    
    expect(screen.getByRole('button', { name: 'downloader.fetchInfo' })).toBeEnabled();
  });

  it('handles fetch error and transitions back', async () => {
    const user = userEvent.setup();
    vi.mocked(window.electronAPI.fetchYtInfo).mockResolvedValueOnce({ success: false, error: 'Failed to fetch' });
    
    render(<DownloaderModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
    await user.type(input, 'https://youtube.com/watch?v=123');
    
    const fetchBtn = screen.getByRole('button', { name: 'downloader.fetchInfo' });
    await user.click(fetchBtn);
    
    await waitFor(() => {
      expect(screen.getByText('downloader.error')).toBeInTheDocument();
    });
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    
    const cancelBtn = screen.getByRole('button', { name: 'common.cancel' });
    await user.click(cancelBtn);
    
    // Should go back to input state
    expect(screen.getByPlaceholderText('https://www.youtube.com/watch?v=...')).toBeInTheDocument();
  });

  it('handles successful fetch and shows preview without duplicate', async () => {
    const user = userEvent.setup();
    vi.mocked(window.electronAPI.fetchYtInfo).mockResolvedValueOnce({
      success: true,
      info: { id: '123', title: 'Song Title', artist: 'Artist', album: 'Album', thumbnail: 'thumb.jpg', duration: 100 }
    });
    vi.mocked(window.electronAPI.checkDuplicate).mockResolvedValueOnce({ isDuplicate: false, existingSong: null });
    
    render(<DownloaderModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
    await user.type(input, 'https://youtube.com/watch?v=123');
    await user.click(screen.getByRole('button', { name: 'downloader.fetchInfo' }));
    
    await waitFor(() => {
      expect(screen.getByText('Song Title')).toBeInTheDocument();
    });
    expect(screen.getByText('Artist')).toBeInTheDocument();
    expect(screen.getByText('Album')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /downloader.downloadNow/i })).toBeInTheDocument();
  });

  it('shows duplicate warning in preview', async () => {
    const user = userEvent.setup();
    vi.mocked(window.electronAPI.fetchYtInfo).mockResolvedValueOnce({
      success: true,
      info: { id: '123', title: 'Song Title', artist: 'Artist', album: 'Album', thumbnail: 'thumb.jpg', duration: 100 }
    });
    vi.mocked(window.electronAPI.checkDuplicate).mockResolvedValueOnce({ 
      isDuplicate: true, 
      existingSong: { id: 'existing123', title: 'Existing Title', artist: 'Existing Artist' },
      reason: 'URL'
    });
    
    render(<DownloaderModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
    await user.type(input, 'https://youtube.com/watch?v=123');
    await user.click(screen.getByRole('button', { name: 'downloader.fetchInfo' }));
    
    await waitFor(() => {
      expect(screen.getByText('downloader.duplicateWarning')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /downloader.downloadAnyway/i })).toBeInTheDocument();
  });

  it('handles download success and shows success state', async () => {
    const user = userEvent.setup();
    vi.mocked(window.electronAPI.fetchYtInfo).mockResolvedValueOnce({
      success: true,
      info: { id: '123', title: 'Song', artist: 'Art', album: 'Alb', thumbnail: 'th.jpg', duration: 100 }
    });
    vi.mocked(window.electronAPI.checkDuplicate).mockResolvedValueOnce({ isDuplicate: false, existingSong: null });
    vi.mocked(window.electronAPI.downloadYtAudio).mockResolvedValueOnce({ success: true, filePath: '/test/path.mp3' });
    vi.mocked(window.electronAPI.writeAudioMetadata).mockResolvedValueOnce({ success: true });
    vi.mocked(window.electronAPI.importFromPath).mockResolvedValueOnce({ success: true, count: 1 });
    
    render(<DownloaderModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
    await user.type(input, 'https://youtube.com/watch?v=123');
    await user.click(screen.getByRole('button', { name: 'downloader.fetchInfo' }));
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /downloader.downloadNow/i })).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /downloader.downloadNow/i }));
    
    await waitFor(() => {
      expect(screen.getByText('downloader.success')).toBeInTheDocument();
    });
    expect(screen.getByText('/test/path.mp3')).toBeInTheDocument();
  });

  it('handles paste from clipboard correctly', async () => {
    mockReadText.mockResolvedValueOnce('https://www.youtube.com/watch?v=test');
    
    render(<DownloaderModal {...defaultProps} />);
    
    const pasteBtn = screen.getByRole('button', { name: 'downloader.paste' });
    fireEvent.click(pasteBtn);
    
    await waitFor(() => {
      expect(mockReadText).toHaveBeenCalled();
      expect(screen.getByDisplayValue('https://www.youtube.com/watch?v=test')).toBeInTheDocument();
    });
  });
  
  it('prevents closing while busy', async () => {
    const user = userEvent.setup();
    // Use an unresolved promise to keep it in fetching state
    vi.mocked(window.electronAPI.fetchYtInfo).mockReturnValueOnce(new Promise(() => {}));
    
    render(<DownloaderModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
    await user.type(input, 'https://youtube.com/watch?v=123');
    await user.click(screen.getByRole('button', { name: 'downloader.fetchInfo' }));
    
    await waitFor(() => {
      expect(screen.getByText('downloader.searching')).toBeInTheDocument();
    });
    
    // Attempt to close via overlay click
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      await user.click(overlay);
    }
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});
