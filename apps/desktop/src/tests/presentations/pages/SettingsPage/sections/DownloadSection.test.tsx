import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadSection } from '../../../../../presentations/pages/SettingsPage/sections/DownloadSection';
import * as hooks from '@hooks';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all hooks from @hooks
vi.mock('@hooks', () => ({
  useLibrary: vi.fn(),
  useDownload: vi.fn(),
  useSettings: vi.fn(),
  useLanguage: vi.fn(),
  useNotification: vi.fn(() => ({ showNotification: vi.fn() })),
  useTheme: vi.fn(() => ({ appIcon: 'icon' })),
  useLocalFilter: vi.fn((items) => [items, false]),
}));

// Mock components
vi.mock('@components', () => ({
  CustomDropdown: vi.fn(({ value, onChange, options }) => (
    <select 
      data-testid="dropdown" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )),
  DownloadPreviewCard: vi.fn(() => <div data-testid="preview" />),
  DuplicateWarningBanner: vi.fn(() => <div data-testid="banner" />),
  DownloadProgressBar: vi.fn(() => <div data-testid="progress" />),
  SyncHistoryModal: vi.fn(() => <div data-testid="history-modal" />),
  EditModal: vi.fn(() => <div data-testid="edit-modal" />),
  CustomSwitch: vi.fn(({ checked, onChange }) => (
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} data-testid="switch" />
  )),
}));

describe('DownloadSection', () => {
  const mockHandleSyncLibrary = vi.fn();
  const mockUpdateSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(hooks.useLibrary).mockReturnValue({
      isSyncing: false,
      handleSyncLibrary: mockHandleSyncLibrary,
    } as any);

    vi.mocked(hooks.useDownload).mockReturnValue({
      url: '',
      setUrl: vi.fn(),
      downloadState: 'idle',
      fetchInfo: vi.fn(),
      executeDownload: vi.fn(),
      previewItems: [],
      downloads: new Map(),
      activeCount: 0,
      totalProgress: 0,
      duplicateInfo: { warning: null, isAfterDownload: false, reasonAfterDownload: null },
      resetDownload: vi.fn(),
      isLoggedIn: false,
      handleLogin: vi.fn(),
      logout: vi.fn(),
    } as any);

    vi.mocked(hooks.useSettings).mockReturnValue({
      settings: {
        downloads: {
          downloadPath: '/downloads',
          autoImportPaths: [],
          backgroundSync: 0,
          bitrate: '320',
        },
      },
      updateSettings: mockUpdateSettings,
      selectDirectory: vi.fn(),
      isSaving: false,
    } as any);

    vi.mocked(hooks.useLanguage).mockReturnValue({
      t: (key: string) => key,
    } as any);
  });

  it('should render section title and description', () => {
    render(<DownloadSection />);
    expect(screen.getByText('settings.downloads.path')).toBeInTheDocument();
  });

  it('should trigger library sync when Scan Now button is clicked', async () => {
    const user = userEvent.setup();
    render(<DownloadSection />);

    const scanBtn = screen.getByText('libraryCleanup.scanNow');
    await user.click(scanBtn);

    expect(mockHandleSyncLibrary).toHaveBeenCalled();
  });

  it('should show scanning status when isSyncing is true', () => {
    vi.mocked(hooks.useLibrary).mockReturnValue({
      isSyncing: true,
      handleSyncLibrary: mockHandleSyncLibrary,
    } as any);

    render(<DownloadSection />);
    expect(screen.getByText('libraryCleanup.scanning')).toBeInTheDocument();
  });

  it('should change background sync interval', async () => {
    const user = userEvent.setup();
    render(<DownloadSection />);

    const dropdowns = screen.getAllByTestId('dropdown');
    // bit rate is first, background sync is second
    const bgSyncDropdown = dropdowns[1]; 
    
    await user.selectOptions(bgSyncDropdown, '120');

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      downloads: expect.objectContaining({
        backgroundSync: 120
      })
    });
  });
});
