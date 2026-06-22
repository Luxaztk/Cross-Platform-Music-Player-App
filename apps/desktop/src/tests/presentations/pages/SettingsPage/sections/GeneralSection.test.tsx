import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeneralSection } from '../../../../../presentations/pages/SettingsPage/sections/GeneralSection';
import { useSettings, useLanguage } from '../../../../../application/hooks';

vi.mock('lucide-react', () => ({
  Languages: () => <svg data-testid="icon-languages" />,
  RotateCcw: () => <svg data-testid="icon-rotate" />,
}));

vi.mock('@components', () => ({
  CustomDropdown: ({ value, onChange, options, title }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; title?: string }) => (
    <div data-testid="custom-dropdown" title={title}>
      <span data-testid="selected-value">{value}</span>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../../../application/hooks', () => ({
  useSettings: vi.fn(),
  useLanguage: vi.fn(),
}));

describe('GeneralSection', () => {
  let mockUpdateSettings: ReturnType<typeof vi.fn>;
  let mockResetSettings: ReturnType<typeof vi.fn>;
  let mockSetLanguage: ReturnType<typeof vi.fn>;
  let mockT: ReturnType<typeof vi.fn>;
  let mockCheckForUpdatesManual: ReturnType<typeof vi.fn>;
  let mockRestartApp: ReturnType<typeof vi.fn>;
  let mockOnUpdateAvailable: ReturnType<typeof vi.fn>;
  let mockOnUpdateNotAvailable: ReturnType<typeof vi.fn>;
  let mockOnUpdateError: ReturnType<typeof vi.fn>;
  let mockOnUpdateDownloaded: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUpdateSettings = vi.fn();
    mockResetSettings = vi.fn();
    mockSetLanguage = vi.fn();
    mockT = vi.fn((key: string) => key);

    vi.mocked(useSettings).mockReturnValue({
      settings: { general: { language: 'vi', autoUpdate: true } },
      updateSettings: mockUpdateSettings,
      resetSettings: mockResetSettings,
      isSaving: false,
    } as unknown as ReturnType<typeof useSettings>);

    vi.mocked(useLanguage).mockReturnValue({
      t: mockT,
      setLanguage: mockSetLanguage,
    } as unknown as ReturnType<typeof useLanguage>);

    mockCheckForUpdatesManual = vi.fn().mockResolvedValue(undefined);
    mockRestartApp = vi.fn();
    mockOnUpdateAvailable = vi.fn().mockReturnValue(vi.fn());
    mockOnUpdateNotAvailable = vi.fn().mockReturnValue(vi.fn());
    mockOnUpdateError = vi.fn().mockReturnValue(vi.fn());
    mockOnUpdateDownloaded = vi.fn().mockReturnValue(vi.fn());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).electronAPI = {
      checkForUpdatesManual: mockCheckForUpdatesManual,
      restartApp: mockRestartApp,
      onUpdateAvailable: mockOnUpdateAvailable,
      onUpdateNotAvailable: mockOnUpdateNotAvailable,
      onUpdateError: mockOnUpdateError,
      onUpdateDownloaded: mockOnUpdateDownloaded,
    };

    localStorage.clear();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).electronAPI;
  });

  it('renders all settings when no searchQuery', () => {
    render(<GeneralSection searchQuery="" />);
    expect(screen.getByText('settings.general.title')).toBeInTheDocument();
    expect(screen.getByText('settings.general.language')).toBeInTheDocument();
    expect(screen.getByText('settings.general.autoUpdate')).toBeInTheDocument();
    expect(screen.getByText('settings.general.showTips')).toBeInTheDocument();
    expect(screen.getByText('settings.general.reset')).toBeInTheDocument();
  });

  it('returns null if searchQuery does not match anything', () => {
    const { container } = render(<GeneralSection searchQuery="something unmatched" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only matching section based on searchQuery', () => {
    mockT.mockImplementation((key) => {
      if (key === 'settings.general.language') return 'Language setting';
      return key;
    });

    render(<GeneralSection searchQuery="language" />);
    expect(screen.getByText('Language setting')).toBeInTheDocument();
    expect(screen.queryByText('settings.general.autoUpdate')).not.toBeInTheDocument();
  });

  it('changes language', () => {
    render(<GeneralSection searchQuery="" />);
    act(() => {
      screen.getByText('English').click();
    });
    expect(mockSetLanguage).toHaveBeenCalledWith('en');
    expect(mockUpdateSettings).toHaveBeenCalledWith({ general: { language: 'en' } });
  });

  it('toggles auto update', () => {
    render(<GeneralSection searchQuery="" />);
    const toggle = screen.getAllByRole('checkbox', { hidden: true })[0] as HTMLInputElement;
    act(() => {
      fireEvent.click(toggle);
    });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ general: { autoUpdate: false } });
  });

  it('toggles show tips and updates localStorage', () => {
    render(<GeneralSection searchQuery="" />);
    const toggle = screen.getAllByRole('checkbox', { hidden: true })[1] as HTMLInputElement;
    
    // Initially true
    expect(toggle.checked).toBe(true);
    
    act(() => {
      fireEvent.click(toggle);
    });
    expect(localStorage.getItem('hide_did_you_know')).toBe('true');
    expect(toggle.checked).toBe(false);

    act(() => {
      fireEvent.click(toggle);
    });
    expect(localStorage.getItem('hide_did_you_know')).toBeNull();
    expect(toggle.checked).toBe(true);
  });

  it('resets settings on confirm', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<GeneralSection searchQuery="" />);
    
    act(() => {
      screen.getByText('settings.general.resetBtn').click();
    });
    
    expect(confirmSpy).toHaveBeenCalledWith('settings.general.resetConfirm');
    expect(mockResetSettings).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('does not reset settings on cancel', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<GeneralSection searchQuery="" />);
    
    act(() => {
      screen.getByText('settings.general.resetBtn').click();
    });
    
    expect(mockResetSettings).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('checks for updates manually', async () => {
    render(<GeneralSection searchQuery="" />);
    
    await act(async () => {
      screen.getByText('settings.general.checkUpdates').click();
    });

    expect(mockCheckForUpdatesManual).toHaveBeenCalled();
    expect(screen.getAllByText('settings.general.checkingUpdates').length).toBeGreaterThan(0);
  });

  it('handles update events', () => {
    render(<GeneralSection searchQuery="" />);
    
    act(() => {
      mockOnUpdateAvailable.mock.calls[0][0]('2.0.0');
    });
    expect(screen.getByText('settings.general.updateAvailable: 2.0.0')).toBeInTheDocument();

    act(() => {
      mockOnUpdateNotAvailable.mock.calls[0][0]();
    });
    expect(screen.getByText('settings.general.upToDate')).toBeInTheDocument();

    act(() => {
      mockOnUpdateError.mock.calls[0][0]('Network Error');
    });
    expect(screen.getByText('common.error: Network Error')).toBeInTheDocument();

    act(() => {
      mockOnUpdateDownloaded.mock.calls[0][0]();
    });
    expect(screen.getByText('update.ready')).toBeInTheDocument();
    
    // Check restart button appears and auto update toggle gets disabled
    const restartBtn = screen.getByText('update.restartNow');
    expect(restartBtn).toBeInTheDocument();
    
    const toggles = screen.getAllByRole('checkbox', { hidden: true });
    expect(toggles[0]).toBeDisabled();
    
    act(() => {
      restartBtn.click();
    });
    expect(mockRestartApp).toHaveBeenCalled();
  });

  it('syncs tips toggle state across windows', () => {
    render(<GeneralSection searchQuery="" />);
    const toggle = screen.getAllByRole('checkbox', { hidden: true })[1] as HTMLInputElement;
    expect(toggle.checked).toBe(true);

    act(() => {
      localStorage.setItem('hide_did_you_know', 'true');
      window.dispatchEvent(new Event('did_you_know_changed'));
    });

    expect(toggle.checked).toBe(false);
  });
});
