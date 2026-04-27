import { render, screen, act } from '@testing-library/react';
import { LibraryProvider } from '../../../../presentations/components/Library/LibraryProvider';
import { useLibrary } from '@music/hooks';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@music/hooks', async () => {
  const actual = await vi.importActual('@music/hooks');
  return {
    ...actual as any,
    SharedLibraryProvider: vi.fn(({ children, onSyncComplete, onSyncStart }) => (
      <div 
        data-testid="shared-provider" 
        onClick={() => {
          if (onSyncStart) onSyncStart({ isSilent: true });
          onSyncComplete({ added: 1, migrated: 1, missingCount: 0 }, { setShowCleanupModal: vi.fn() });
        }}
      >
        {children}
      </div>
    )),
    useLibrary: vi.fn(),
  };
});

vi.mock('../../../../infrastructure/repositories', () => ({
  ElectronLibraryRepository: vi.fn(),
}));

const mockShowNotification = vi.fn();
const mockUpdateNotification = vi.fn();
const mockRemoveNotification = vi.fn();

vi.mock('@hooks', () => ({
  useNotification: vi.fn(() => ({ 
    showNotification: mockShowNotification,
    updateNotification: mockUpdateNotification,
    removeNotification: mockRemoveNotification
  })),
  useLanguage: vi.fn(() => ({ t: (key: string) => key })),
}));

// Mock components to avoid deep rendering issues
vi.mock('@components', () => ({
  CleanupResolutionModal: vi.fn(() => <div data-testid="cleanup-modal" />),
}));

describe('LibraryProvider (Desktop)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useLibrary as any).mockReturnValue({
      showCleanupModal: false,
      missingSongs: [],
      setShowCleanupModal: vi.fn(),
      handleDeleteSongs: vi.fn().mockResolvedValue(true),
    });
  });

  it('should render SharedLibraryProvider with children', () => {
    render(
      <LibraryProvider>
        <div data-testid="child">Test Child</div>
      </LibraryProvider>
    );

    expect(screen.getByTestId('shared-provider')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should show notification when sync completes with zero missing songs', async () => {
    render(<LibraryProvider>Children</LibraryProvider>);

    // Trigger the onSyncComplete via mock click
    const provider = screen.getByTestId('shared-provider');
    await act(async () => {
      provider.click();
    });

    expect(mockShowNotification).toHaveBeenCalledWith('info', expect.any(String), expect.any(Object));
    expect(mockUpdateNotification).toHaveBeenCalledWith('sync-toast', expect.objectContaining({ type: 'success' }));
  });

  it('should render CleanupResolutionModal within the provider', () => {
    (useLibrary as any).mockReturnValue({
      showCleanupModal: true,
      missingSongs: [{ id: '1', title: 'Missing' }],
      setShowCleanupModal: vi.fn(),
      handleDeleteSongs: vi.fn().mockResolvedValue(true),
    });

    render(<LibraryProvider>Children</LibraryProvider>);
    expect(screen.getByTestId('cleanup-modal')).toBeInTheDocument();
  });
});
