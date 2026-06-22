import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MainLayout from '../../../../presentations/components/Layout/MainLayout';
import { useUI, useLibraryContext } from '@music/hooks';
import { useLanguage, useNotification, useGlobalHotkeys } from '../../../../application/hooks';
import { useHotkeysModal } from '../../../../application/context/HotkeysContext';
import { MemoryRouter } from 'react-router-dom';

// Mock components
vi.mock('../../../../presentations/components', () => ({
  Sidebar: ({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) => (
    <div data-testid="sidebar" data-collapsed={isCollapsed}>
      <button data-testid="toggle-sidebar" onClick={onToggle}>Toggle Sidebar</button>
    </div>
  ),
  Header: () => <header data-testid="header" />,
  PlayerBar: () => <div data-testid="player-bar" />,
  DuplicateResolutionModal: ({ isOpen, duplicates, onClose, onResolve }: { isOpen: boolean; duplicates: { id: string; title: string }[]; onClose: () => void; onResolve: () => void }) => (
    <div data-testid="duplicate-modal" data-isopen={isOpen}>
      {duplicates.map((d) => <span key={d.id}>{d.title}</span>)}
      <button data-testid="close-duplicate" onClick={onClose}>Close</button>
      <button data-testid="resolve-duplicate" onClick={onResolve}>Resolve</button>
    </div>
  ),
  LyricsPanel: () => <div data-testid="lyrics-panel" />,
  HotkeysModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="hotkeys-modal" data-isopen={isOpen}>
      <button data-testid="close-hotkeys" onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock hooks
vi.mock('@music/hooks', () => ({
  useUI: vi.fn(),
  useLibraryContext: vi.fn(),
}));

vi.mock('../../../../application/hooks', () => ({
  useLanguage: vi.fn(),
  useNotification: vi.fn(),
  useGlobalHotkeys: vi.fn(),
}));

vi.mock('../../../../application/context/HotkeysContext', () => ({
  useHotkeysModal: vi.fn(),
}));

describe('MainLayout', () => {
  let mockShowNotification: ReturnType<typeof vi.fn>;
  let mockClearDuplicates: ReturnType<typeof vi.fn>;
  let mockHandleAddSongs: ReturnType<typeof vi.fn>;
  let mockCloseHotkeysModal: ReturnType<typeof vi.fn>;
  let mockT: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockShowNotification = vi.fn();
    mockClearDuplicates = vi.fn();
    mockHandleAddSongs = vi.fn();
    mockCloseHotkeysModal = vi.fn();
    mockT = vi.fn((key: string) => key);

    vi.mocked(useNotification).mockReturnValue({
      showNotification: mockShowNotification,
      clearNotification: vi.fn(),
    } as unknown as ReturnType<typeof useNotification>);

    vi.mocked(useLanguage).mockReturnValue({
      t: mockT,
    } as unknown as ReturnType<typeof useLanguage>);

    vi.mocked(useGlobalHotkeys).mockReturnValue(undefined);

    vi.mocked(useHotkeysModal).mockReturnValue({
      isHotkeysModalOpen: false,
      closeHotkeysModal: mockCloseHotkeysModal,
    } as unknown as ReturnType<typeof useHotkeysModal>);

    vi.mocked(useUI).mockReturnValue({
      isLyricsOpen: false,
    } as unknown as ReturnType<typeof useUI>);

    vi.mocked(useLibraryContext).mockReturnValue({
      duplicateSongs: [],
      handleAddSongs: mockHandleAddSongs,
      clearDuplicates: mockClearDuplicates,
    } as unknown as ReturnType<typeof useLibraryContext>);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );
  };

  it('renders default layout correctly', () => {
    renderComponent();

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-collapsed', 'false');
    expect(screen.getByTestId('player-bar')).toBeInTheDocument();
    
    // Lyrics should not be rendered initially
    expect(screen.queryByTestId('lyrics-panel')).not.toBeInTheDocument();
  });

  it('toggles sidebar collapse state', () => {
    renderComponent();

    const toggleBtn = screen.getByTestId('toggle-sidebar');
    const sidebar = screen.getByTestId('sidebar');

    expect(sidebar).toHaveAttribute('data-collapsed', 'false');

    act(() => {
      toggleBtn.click();
    });

    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  });

  it('renders LyricsPanel when isLyricsOpen is true', () => {
    vi.mocked(useUI).mockReturnValue({
      isLyricsOpen: true,
    } as unknown as ReturnType<typeof useUI>);

    renderComponent();

    expect(screen.getByTestId('lyrics-panel')).toBeInTheDocument();
  });

  it('renders DuplicateResolutionModal and shows notification when duplicates exist', () => {
    const mockDuplicates = [{ id: '1', title: 'Song 1' }];
    vi.mocked(useLibraryContext).mockReturnValue({
      duplicateSongs: mockDuplicates,
      handleAddSongs: mockHandleAddSongs,
      clearDuplicates: mockClearDuplicates,
    } as unknown as ReturnType<typeof useLibraryContext>);

    renderComponent();

    const modal = screen.getByTestId('duplicate-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('data-isopen', 'true');
    expect(screen.getByText('Song 1')).toBeInTheDocument();

    expect(mockShowNotification).toHaveBeenCalledWith('info', 'modal.duplicatesFound');
  });

  it('handles DuplicateResolutionModal actions', () => {
    const mockDuplicates = [{ id: '1', title: 'Song 1' }];
    vi.mocked(useLibraryContext).mockReturnValue({
      duplicateSongs: mockDuplicates,
      handleAddSongs: mockHandleAddSongs,
      clearDuplicates: mockClearDuplicates,
    } as unknown as ReturnType<typeof useLibraryContext>);

    renderComponent();

    const closeBtn = screen.getByTestId('close-duplicate');
    const resolveBtn = screen.getByTestId('resolve-duplicate');

    act(() => {
      closeBtn.click();
    });
    expect(mockClearDuplicates).toHaveBeenCalled();

    act(() => {
      resolveBtn.click();
    });
    expect(mockHandleAddSongs).toHaveBeenCalled();
  });

  it('renders HotkeysModal with correct props', () => {
    vi.mocked(useHotkeysModal).mockReturnValue({
      isHotkeysModalOpen: true,
      closeHotkeysModal: mockCloseHotkeysModal,
    } as unknown as ReturnType<typeof useHotkeysModal>);

    renderComponent();

    const modal = screen.getByTestId('hotkeys-modal');
    expect(modal).toHaveAttribute('data-isopen', 'true');

    const closeBtn = screen.getByTestId('close-hotkeys');
    act(() => {
      closeBtn.click();
    });
    expect(mockCloseHotkeysModal).toHaveBeenCalled();
  });

  it('calls useGlobalHotkeys', () => {
    renderComponent();
    expect(useGlobalHotkeys).toHaveBeenCalled();
  });
});
