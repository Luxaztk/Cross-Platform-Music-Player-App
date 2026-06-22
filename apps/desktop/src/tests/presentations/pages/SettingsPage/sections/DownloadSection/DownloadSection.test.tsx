import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DownloadSection } from '../../../../../../presentations/pages/SettingsPage/sections/DownloadSection';
import { useDownloadSection } from '../../../../../../presentations/pages/SettingsPage/sections/DownloadSection/useDownloadSection';

vi.mock('lucide-react', () => ({
  Download: () => <svg data-testid="icon-download" />
}));

vi.mock('../../../../../../presentations/pages/SettingsPage/sections/DownloadSection/useDownloadSection', () => ({
  useDownloadSection: vi.fn()
}));

vi.mock('@components', () => ({
  SyncHistoryModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => isOpen ? <div data-testid="sync-history-modal"><button onClick={onClose}>Close Sync</button></div> : null,
  EditModal: ({ isOpen, onClose, onSave, data, isBulk }: { isOpen: boolean; onClose: () => void; onSave: (data: Record<string, string>) => void; data: unknown; isBulk: boolean }) => isOpen ? (
    <div data-testid="edit-modal" data-isbulk={isBulk}>
      <button onClick={onClose}>Close Edit</button>
      <button onClick={() => onSave({ title: 'New Title', artist: 'New Artist' })}>Save Edit</button>
      <span data-testid="edit-data">{JSON.stringify(data)}</span>
    </div>
  ) : null,
}));

vi.mock('../../../../../../presentations/pages/SettingsPage/sections/DownloadSection/components/PathSettings', () => ({
  PathSettings: ({ isVisible }: { isVisible: boolean }) => isVisible ? <div data-testid="path-settings" /> : null
}));

vi.mock('../../../../../../presentations/pages/SettingsPage/sections/DownloadSection/components/DownloaderTool', () => ({
  DownloaderTool: ({ isVisible }: { isVisible: boolean }) => isVisible ? <div data-testid="downloader-tool" /> : null
}));

vi.mock('../../../../../../presentations/pages/SettingsPage/sections/DownloadSection/components/YoutubeAuth', () => ({
  YoutubeAuth: ({ isVisible }: { isVisible: boolean }) => isVisible ? <div data-testid="youtube-auth" /> : null
}));

vi.mock('../../../../../../presentations/pages/SettingsPage/sections/DownloadSection/components/QualitySettings', () => ({
  QualitySettings: ({ isVisible, onBitrateChange }: { isVisible: boolean; onBitrateChange: (v: string) => void }) => isVisible ? (
    <div data-testid="quality-settings">
      <button onClick={() => onBitrateChange('320')}>Set Bitrate</button>
    </div>
  ) : null,
  BackgroundSyncSettings: ({ isVisible, onChange }: { isVisible: boolean; onChange: (v: number) => void }) => isVisible ? (
    <div data-testid="background-sync-settings">
      <button onClick={() => onChange(1)}>Set Sync</button>
    </div>
  ) : null
}));

vi.mock('../../../../../../presentations/pages/SettingsPage/sections/DownloadSection/components/MaintenanceSettings', () => ({
  MaintenanceSettings: ({ isVisible }: { isVisible: boolean }) => isVisible ? <div data-testid="maintenance-settings" /> : null
}));

vi.mock('../../../../../../presentations/pages/SettingsPage/sections/DownloadSection/components/AutoImportSettings', () => ({
  AutoImportSettings: ({ isVisible }: { isVisible: boolean }) => isVisible ? <div data-testid="auto-import-settings" /> : null
}));

describe('DownloadSection', () => {
  let mockUpdateSettings: ReturnType<typeof vi.fn>;
  let mockManagerUpdateMetadata: ReturnType<typeof vi.fn>;
  let mockManagerBulkUpdateMetadata: ReturnType<typeof vi.fn>;
  let mockSetShowHistory: ReturnType<typeof vi.fn>;
  let mockSetEditingItem: ReturnType<typeof vi.fn>;
  let mockSetShowBulkEdit: ReturnType<typeof vi.fn>;
  let mockSetShowEditMetadata: ReturnType<typeof vi.fn>;

  const defaultMockReturn = () => ({
    settings: {
      downloads: { bitrate: '128', autoImportPaths: [], backgroundSync: 0 }
    },
    updateSettings: mockUpdateSettings,
    manager: {
      isLoggedIn: false,
      previewItems: [],
      updateMetadata: mockManagerUpdateMetadata,
      bulkUpdateMetadata: mockManagerBulkUpdateMetadata,
    },
    isSaving: false,
    t: vi.fn((key: string) => key),
    uiState: {
      isSyncing: false,
      showHistory: false,
      editingItem: null,
      showBulkEdit: false,
      showEditMetadata: false,
    },
    visibility: {
      showsPath: true,
      showsQuality: true,
      showsAutoImport: true,
      showsMaintenance: true,
      showsDownloader: true,
    },
    actions: {
      handleSelectPath: vi.fn(),
      handleFetchAndDownload: vi.fn(),
      handlePaste: vi.fn(),
      setEditingItem: mockSetEditingItem,
      setShowBulkEdit: mockSetShowBulkEdit,
      handleAddImportPath: vi.fn(),
      handleRemoveImportPath: vi.fn(),
      handleSyncLibrary: vi.fn(),
      setShowHistory: mockSetShowHistory,
      setShowEditMetadata: mockSetShowEditMetadata,
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSettings = vi.fn();
    mockManagerUpdateMetadata = vi.fn();
    mockManagerBulkUpdateMetadata = vi.fn();
    mockSetShowHistory = vi.fn();
    mockSetEditingItem = vi.fn();
    mockSetShowBulkEdit = vi.fn();
    mockSetShowEditMetadata = vi.fn();

    vi.mocked(useDownloadSection).mockReturnValue(defaultMockReturn() as unknown as ReturnType<typeof useDownloadSection>);
  });

  it('renders all sections when visibility is true', () => {
    render(<DownloadSection />);
    expect(screen.getByTestId('path-settings')).toBeInTheDocument();
    expect(screen.getByTestId('downloader-tool')).toBeInTheDocument();
    expect(screen.getByTestId('youtube-auth')).toBeInTheDocument();
    expect(screen.getByTestId('quality-settings')).toBeInTheDocument();
    expect(screen.getByTestId('auto-import-settings')).toBeInTheDocument();
    expect(screen.getByTestId('background-sync-settings')).toBeInTheDocument();
    expect(screen.getByTestId('maintenance-settings')).toBeInTheDocument();
  });

  it('returns null if searchQuery has value and all visibility flags are false', () => {
    const mockReturn = defaultMockReturn();
    mockReturn.visibility = {
      showsPath: false,
      showsQuality: false,
      showsAutoImport: false,
      showsMaintenance: false,
      showsDownloader: false,
    };
    vi.mocked(useDownloadSection).mockReturnValue(mockReturn as unknown as ReturnType<typeof useDownloadSection>);

    const { container } = render(<DownloadSection searchQuery="something" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('calls updateSettings when bitrate changes', () => {
    render(<DownloadSection />);
    act(() => {
      screen.getByText('Set Bitrate').click();
    });
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      downloads: expect.objectContaining({ bitrate: '320' })
    });
  });

  it('calls updateSettings when backgroundSync changes', () => {
    render(<DownloadSection />);
    act(() => {
      screen.getByText('Set Sync').click();
    });
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      downloads: expect.objectContaining({ backgroundSync: 1 })
    });
  });

  it('renders SyncHistoryModal when showHistory is true', () => {
    const mockReturn = defaultMockReturn();
    mockReturn.uiState.showHistory = true;
    vi.mocked(useDownloadSection).mockReturnValue(mockReturn as unknown as ReturnType<typeof useDownloadSection>);

    render(<DownloadSection />);
    expect(screen.getByTestId('sync-history-modal')).toBeInTheDocument();

    act(() => {
      screen.getByText('Close Sync').click();
    });
    expect(mockSetShowHistory).toHaveBeenCalledWith(false);
  });

  it('renders EditModal for a single editing item and handles save/close', () => {
    const mockReturn = defaultMockReturn();
    mockReturn.uiState.editingItem = {
      id: '123',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      thumbnail: 'thumb.jpg'
    } as unknown as typeof mockReturn.uiState.editingItem;
    vi.mocked(useDownloadSection).mockReturnValue(mockReturn as unknown as ReturnType<typeof useDownloadSection>);

    render(<DownloadSection />);
    const modal = screen.getByTestId('edit-modal');
    expect(modal).toBeInTheDocument();

    act(() => {
      screen.getByText('Close Edit').click();
    });
    expect(mockSetEditingItem).toHaveBeenCalledWith(null);

    act(() => {
      screen.getByText('Save Edit').click();
    });
    expect(mockManagerUpdateMetadata).toHaveBeenCalledWith('123', { title: 'New Title', artist: 'New Artist' });
    expect(mockSetEditingItem).toHaveBeenCalledWith(null);
  });

  it('renders Bulk EditModal when showBulkEdit is true', () => {
    const mockReturn = defaultMockReturn();
    mockReturn.uiState.showBulkEdit = true;
    mockReturn.manager.previewItems = [
      { id: '1', title: 'S1', artist: 'A1', album: 'Al1' },
      { id: '2', title: 'S2', artist: 'A1', album: 'Al1' }
    ] as unknown as typeof mockReturn.manager.previewItems;
    vi.mocked(useDownloadSection).mockReturnValue(mockReturn as unknown as ReturnType<typeof useDownloadSection>);

    render(<DownloadSection />);
    const modal = screen.getByTestId('edit-modal');
    expect(modal).toHaveAttribute('data-isbulk', 'true');

    act(() => {
      screen.getByText('Close Edit').click();
    });
    expect(mockSetShowBulkEdit).toHaveBeenCalledWith(false);
    expect(mockSetShowEditMetadata).toHaveBeenCalledWith(false);

    act(() => {
      screen.getByText('Save Edit').click();
    });
    expect(mockManagerBulkUpdateMetadata).toHaveBeenCalledWith({ artist: 'New Artist' });
  });

  it('renders single EditModal if showEditMetadata is true and previewItems has 1 item', () => {
    const mockReturn = defaultMockReturn();
    mockReturn.uiState.showEditMetadata = true;
    mockReturn.manager.previewItems = [
      { id: '1', title: 'S1', artist: 'A1', album: 'Al1', thumbnail: 't.jpg' }
    ] as unknown as typeof mockReturn.manager.previewItems;
    vi.mocked(useDownloadSection).mockReturnValue(mockReturn as unknown as ReturnType<typeof useDownloadSection>);

    render(<DownloadSection />);
    const modal = screen.getByTestId('edit-modal');
    expect(modal).toHaveAttribute('data-isbulk', 'false');

    act(() => {
      screen.getByText('Save Edit').click();
    });
    expect(mockManagerUpdateMetadata).toHaveBeenCalledWith('1', { title: 'New Title', artist: 'New Artist' });
  });
});
