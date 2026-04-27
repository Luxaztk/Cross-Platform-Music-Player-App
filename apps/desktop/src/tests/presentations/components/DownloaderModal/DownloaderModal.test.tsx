// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DownloaderModal } from '@components/DownloaderModal';
import { useDownload } from '@hooks';

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
  }),
  useDownload: vi.fn(),
}));

describe('DownloaderModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  const mockSetUrl = vi.fn();
  const mockFetchInfo = vi.fn();
  const mockResetDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useDownload as any).mockReturnValue({
      url: '',
      setUrl: mockSetUrl,
      downloadState: 'idle',
      fetchInfo: mockFetchInfo,
      resetDownload: mockResetDownload,
      initiator: 'modal'
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<DownloaderModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders initial input state correctly', () => {
    render(<DownloaderModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('https://www.youtube.com/watch?v=...')).toBeInTheDocument();
  });

  it('calls setUrl when typing', async () => {
    const user = userEvent.setup();
    render(<DownloaderModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
    await user.type(input, 'h');
    
    expect(mockSetUrl).toHaveBeenCalledWith('h');
  });

  it('calls fetchInfo when clicking fetch button', async () => {
    (useDownload as any).mockReturnValue({
      url: 'https://youtube.com/watch?v=123',
      setUrl: mockSetUrl,
      downloadState: 'idle',
      fetchInfo: mockFetchInfo,
      resetDownload: mockResetDownload,
    });

    const user = userEvent.setup();
    render(<DownloaderModal {...defaultProps} />);
    
    const fetchBtn = screen.getByRole('button', { name: 'downloader.fetchInfo' });
    await user.click(fetchBtn);
    
    expect(mockFetchInfo).toHaveBeenCalledWith('https://youtube.com/watch?v=123', 'modal');
  });

  it('shows searching state when fetching', () => {
    (useDownload as any).mockReturnValue({
      url: 'https://youtube.com/watch?v=123',
      downloadState: 'fetching',
      fetchInfo: mockFetchInfo,
    });

    render(<DownloaderModal {...defaultProps} />);
    expect(screen.getByText('downloader.searching')).toBeInTheDocument();
  });

  it('shows error state when error occurs', () => {
    (useDownload as any).mockReturnValue({
      downloadState: 'error',
      downloadError: 'Failed to fetch',
      fetchInfo: mockFetchInfo,
    });

    render(<DownloaderModal {...defaultProps} />);
    expect(screen.getByText('downloader.error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('shows preview state when info is fetched', () => {
    (useDownload as any).mockReturnValue({
      downloadState: 'preview',
      videoInfo: { id: '123', title: 'Song Title', artist: 'Artist', album: 'Album', thumbnail: 'thumb.jpg', duration: 100 },
      duplicateInfo: { isDuplicate: false },
      fetchInfo: mockFetchInfo,
    });

    render(<DownloaderModal {...defaultProps} />);
    expect(screen.getByText('Song Title')).toBeInTheDocument();
  });

  it('prevents closing while busy', async () => {
    (useDownload as any).mockReturnValue({
      downloadState: 'downloading',
      fetchInfo: mockFetchInfo,
    });
    
    render(<DownloaderModal {...defaultProps} />);
    
    // Attempt to close via overlay click
    const user = userEvent.setup();
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      await user.click(overlay);
    }
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});
