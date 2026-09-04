import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { AudioSection } from '../../../../../presentations/pages/SettingsPage/sections/AudioSection';
import { useSettings, useLanguage } from '../../../../../application/hooks';
import { useAudioDevices, usePlayer } from '@music/hooks';


vi.mock('lucide-react', () => ({
  Volume2: () => <svg data-testid="icon-volume" />,
  Play: () => <svg data-testid="icon-play" />,
  HelpCircle: () => <svg data-testid="icon-help" />
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
  SmartTooltip: ({ children, content }: { children: ReactNode; content?: string }) => (
    <div data-testid="smart-tooltip" title={content}>
      {children}
    </div>
  )
}));

vi.mock('../../../../../application/hooks', () => ({
  useSettings: vi.fn(),
  useLanguage: vi.fn(),
}));

vi.mock('@music/hooks', () => ({
  useAudioDevices: vi.fn(),
  usePlayer: vi.fn(),
}));

describe('AudioSection', () => {
  let mockUpdateSettings: ReturnType<typeof vi.fn>;
  let mockSetAudioDevice: ReturnType<typeof vi.fn>;
  let mockGetAnalyser: ReturnType<typeof vi.fn>;
  let mockT: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUpdateSettings = vi.fn();
    mockSetAudioDevice = vi.fn();
    mockGetAnalyser = vi.fn().mockReturnValue(null);
    mockT = vi.fn((key: string) => key);

    vi.mocked(useSettings).mockReturnValue({
      settings: { audio: { deviceId: 'default' } },
      updateSettings: mockUpdateSettings
    } as unknown as ReturnType<typeof useSettings>);

    vi.mocked(useLanguage).mockReturnValue({
      t: mockT
    } as unknown as ReturnType<typeof useLanguage>);

    vi.mocked(useAudioDevices).mockReturnValue({
      devices: [
        { deviceId: 'default', label: 'Default Device' },
        { deviceId: 'device-1', label: 'Device 1' }
      ],
      currentDeviceId: 'default',
      setAudioDevice: mockSetAudioDevice
    } as unknown as ReturnType<typeof useAudioDevices>);

    vi.mocked(usePlayer).mockReturnValue({
      isPlaying: false,
      getAnalyser: mockGetAnalyser
    } as unknown as ReturnType<typeof usePlayer>);

    // Mock AudioContext
    const mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    
    const mockOscillator = {
      type: '',
      frequency: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      resume = vi.fn().mockResolvedValue(undefined);
      close = vi.fn().mockResolvedValue(undefined);
      createOscillator = vi.fn().mockReturnValue(mockOscillator);
      createGain = vi.fn().mockReturnValue(mockGainNode);
      setSinkId = vi.fn().mockResolvedValue(undefined);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).AudioContext = MockAudioContext;
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).AudioContext;
  });

  it('renders all settings when no searchQuery', () => {
    render(<AudioSection searchQuery="" />);
    expect(screen.getByText('settings.audio.title')).toBeInTheDocument();
    expect(screen.getByText('settings.audio.device')).toBeInTheDocument();
    expect(screen.getByText('settings.audio.test')).toBeInTheDocument();
    expect(screen.getByTestId('custom-dropdown')).toBeInTheDocument();
  });

  it('returns null if searchQuery does not match anything', () => {
    const { container } = render(<AudioSection searchQuery="something unmatched" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only matching section based on searchQuery', () => {
    mockT.mockImplementation((key) => {
      if (key === 'settings.audio.device') return 'Device setting';
      return key;
    });

    render(<AudioSection searchQuery="device" />);
    expect(screen.getByText('Device setting')).toBeInTheDocument();
    expect(screen.queryByText('settings.audio.test')).not.toBeInTheDocument();
  });

  it('calls setAudioDevice and updateSettings when device is changed', () => {
    render(<AudioSection searchQuery="" />);
    
    act(() => {
      screen.getByText('Device 1').click();
    });

    expect(mockSetAudioDevice).toHaveBeenCalledWith('device-1');
    expect(mockUpdateSettings).toHaveBeenCalledWith({ audio: { deviceId: 'device-1' } });
  });

  it('handles playing test sound and resets button after timeout', async () => {
    vi.useFakeTimers();
    render(<AudioSection searchQuery="" />);
    
    const testBtn = screen.getByText('settings.audio.testBtn').closest('button')!;
    expect(testBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(testBtn);
    });

    // Test btn should be active/disabled
    expect(testBtn).toBeDisabled();

    // Advance time past 1300ms to trigger cleanup
    await act(async () => {
      vi.advanceTimersByTime(1400);
    });

    // Test btn should be re-enabled
    expect(testBtn).not.toBeDisabled();
    vi.useRealTimers();
  });

  it('disables test sound button when music is playing', () => {
    vi.mocked(usePlayer).mockReturnValue({
      isPlaying: true,
      getAnalyser: mockGetAnalyser
    } as unknown as ReturnType<typeof usePlayer>);

    render(<AudioSection searchQuery="" />);
    const testBtn = screen.getByText('settings.audio.testBtn').closest('button')!;
    expect(testBtn).toBeDisabled();
  });
});
