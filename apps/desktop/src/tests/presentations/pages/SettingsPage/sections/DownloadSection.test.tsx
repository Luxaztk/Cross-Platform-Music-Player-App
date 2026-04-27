import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadSection } from '../../../../../presentations/pages/SettingsPage/sections/DownloadSection';
import { useLibrary, useDownload, useSettings, useLanguage } from '@hooks';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all hooks
vi.mock('@hooks', () => ({
  useLibrary: vi.fn(),
  useDownload: vi.fn(),
  useSettings: vi.fn(),
  useLanguage: vi.fn(),
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
  CustomSwitch: vi.fn(({ checked, onChange }) => (
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} data-testid="switch" />
  )),
}));

describe('DownloadSection', () => {
  const mockHandleSyncLibrary = vi.fn();
  const mockUpdateSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useLibrary as any).mockReturnValue({
      isSyncing: false,
      handleSyncLibrary: mockHandleSyncLibrary,
    });
    (useDownload as any).mockReturnValue({
      url: '',
      setUrl: vi.fn(),
      downloadState: 'idle',
      fetchInfo: vi.fn(),
      executeDownload: vi.fn(),
    });
    (useSettings as any).mockReturnValue({
      settings: {
        downloads: {
          downloadPath: '/downloads',
          autoImportPaths: [],
          backgroundSync: 0,
        },
      },
      updateSettings: mockUpdateSettings,
      selectDirectory: vi.fn(),
      isSaving: false,
    });
    (useLanguage as any).mockReturnValue({
      t: (key: string) => key,
    });
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
    (useLibrary as any).mockReturnValue({
      isSyncing: true,
      handleSyncLibrary: mockHandleSyncLibrary,
    });

    render(<DownloadSection />);
    expect(screen.getByText('libraryCleanup.scanning')).toBeInTheDocument();
  });

  it('should change background sync interval', async () => {
    const user = userEvent.setup();
    render(<DownloadSection />);

    const dropdowns = screen.getAllByTestId('dropdown');
    // The second dropdown is background sync (first is bitrate)
    const bgSyncDropdown = dropdowns[1]; 
    
    await user.selectOptions(bgSyncDropdown, '120');

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      downloads: expect.objectContaining({
        backgroundSync: 120
      })
    });
  });
});
