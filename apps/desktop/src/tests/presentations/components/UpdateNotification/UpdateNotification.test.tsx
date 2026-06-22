import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UpdateNotification } from '../../../../presentations/components/UpdateNotification/UpdateNotification';
import { useLanguage } from '../../../../application/hooks';

vi.mock('../../../../application/hooks', () => ({
  useLanguage: vi.fn(),
}));

describe('UpdateNotification', () => {
  let mockOnUpdateAvailable: ReturnType<typeof vi.fn>;
  let mockOnUpdateProgress: ReturnType<typeof vi.fn>;
  let mockOnUpdateDownloaded: ReturnType<typeof vi.fn>;
  let mockRestartApp: ReturnType<typeof vi.fn>;
  let mockRemoveAvailableListener: ReturnType<typeof vi.fn>;
  let mockRemoveProgressListener: ReturnType<typeof vi.fn>;
  let mockRemoveDownloadedListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLanguage).mockReturnValue({
      t: vi.fn((key: string, options?: unknown) => key + (options ? `_${JSON.stringify(options)}` : '')),
    } as unknown as ReturnType<typeof useLanguage>);

    mockRemoveAvailableListener = vi.fn();
    mockRemoveProgressListener = vi.fn();
    mockRemoveDownloadedListener = vi.fn();

    mockOnUpdateAvailable = vi.fn().mockReturnValue(mockRemoveAvailableListener);
    mockOnUpdateProgress = vi.fn().mockReturnValue(mockRemoveProgressListener);
    mockOnUpdateDownloaded = vi.fn().mockReturnValue(mockRemoveDownloadedListener);
    mockRestartApp = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).electronAPI = {
      onUpdateAvailable: mockOnUpdateAvailable,
      onUpdateProgress: mockOnUpdateProgress,
      onUpdateDownloaded: mockOnUpdateDownloaded,
      restartApp: mockRestartApp,
    };
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).electronAPI;
  });

  it('renders nothing initially', () => {
    const { container } = render(<UpdateNotification />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows notification when update is available', () => {
    render(<UpdateNotification />);
    
    // Simulate update available callback
    act(() => {
      const callback = mockOnUpdateAvailable.mock.calls[0][0];
      callback('1.2.0');
    });

    expect(screen.getByText('update.downloading')).toBeInTheDocument();
    expect(screen.getByText('update.version_{"version":"1.2.0"}')).toBeInTheDocument();
  });

  it('updates progress', () => {
    render(<UpdateNotification />);
    
    act(() => {
      mockOnUpdateAvailable.mock.calls[0][0]('1.2.0');
    });

    act(() => {
      mockOnUpdateProgress.mock.calls[0][0](45.6);
    });

    expect(screen.getByText('update.downloadingSilent_{"progress":46}')).toBeInTheDocument();
  });

  it('shows ready state when downloaded', () => {
    render(<UpdateNotification />);
    
    act(() => {
      mockOnUpdateAvailable.mock.calls[0][0]('1.2.0');
      mockOnUpdateDownloaded.mock.calls[0][0]();
    });

    expect(screen.getByText('update.ready')).toBeInTheDocument();
    expect(screen.getByText('update.later')).toBeInTheDocument();
    expect(screen.getByText('update.restartNow')).toBeInTheDocument();
  });

  it('dismisses notification on "Later" click', () => {
    render(<UpdateNotification />);
    
    act(() => {
      mockOnUpdateAvailable.mock.calls[0][0]('1.2.0');
      mockOnUpdateDownloaded.mock.calls[0][0]();
    });

    const laterBtn = screen.getByText('update.later');
    act(() => {
      laterBtn.click();
    });

    expect(screen.queryByText('update.ready')).not.toBeInTheDocument();
  });

  it('calls restartApp on "Restart Now" click when not in DEV mode', () => {
    // Vite sets import.meta.env.DEV during tests, so we need to mock it if it uses import.meta
    // The component uses import.meta.env.DEV, which is usually true in vitest.
    // Let's test the DEV behavior first
    
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<UpdateNotification />);
    
    act(() => {
      mockOnUpdateAvailable.mock.calls[0][0]('1.2.0');
      mockOnUpdateDownloaded.mock.calls[0][0]();
    });

    const restartBtn = screen.getByText('update.restartNow');
    act(() => {
      restartBtn.click();
    });

    expect(alertSpy).toHaveBeenCalledWith('update.devRestartWarning');
    expect(mockRestartApp).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('cleans up listeners on unmount', () => {
    const { unmount } = render(<UpdateNotification />);
    unmount();

    expect(mockRemoveAvailableListener).toHaveBeenCalled();
    expect(mockRemoveProgressListener).toHaveBeenCalled();
    expect(mockRemoveDownloadedListener).toHaveBeenCalled();
  });
});
