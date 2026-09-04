import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsProvider } from '../../../application/providers/SettingsProvider';
import { useSettings } from '../../../application/hooks/useSettings';
import { DEFAULT_SETTINGS, type AppSettings } from '../../../presentations/constants/SettingsConstants';

// Helper component to consume SettingsContext
const TestConsumer = () => {
  const { settings, updateSettings, resetSettings } = useSettings();

  return (
    <div>
      <div data-testid="server-url">{settings?.server?.serverUrl}</div>
      <div data-testid="language">{settings?.general?.language}</div>
      <button
        type="button"
        onClick={() => updateSettings({ server: { serverUrl: 'http://localhost:4545', autoConnect: true } })}
      >
        Save Server
      </button>
      <button
        type="button"
        onClick={() => updateSettings({ general: { language: 'en' } })}
      >
        Change Language
      </button>
      <button type="button" onClick={() => resetSettings()}>
        Reset Settings
      </button>
    </div>
  );
};

describe('SettingsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.electronAPI.getSettings).mockResolvedValue({
      ...DEFAULT_SETTINGS,
      server: { serverUrl: 'http://192.168.1.185:4545', autoConnect: false },
    });
    vi.mocked(window.electronAPI.saveSettings).mockResolvedValue(undefined);
  });

  it('loads and renders saved settings from electronAPI', async () => {
    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('server-url')).toHaveTextContent('http://192.168.1.185:4545');
    });
    expect(screen.getByTestId('language')).toHaveTextContent('vi');
  });

  it('preserves all 5 settings sections including server when calling updateSettings', async () => {
    const user = userEvent.setup();
    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('server-url')).toHaveTextContent('http://192.168.1.185:4545');
    });

    await user.click(screen.getByText('Save Server'));

    await waitFor(() => {
      expect(window.electronAPI.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          general: expect.any(Object),
          appearance: expect.any(Object),
          audio: expect.any(Object),
          downloads: expect.any(Object),
          server: {
            serverUrl: 'http://localhost:4545',
            autoConnect: true,
          },
        })
      );
      expect(screen.getByTestId('server-url')).toHaveTextContent('http://localhost:4545');
    });
  });

  it('safely handles legacy saved settings that lack server key', async () => {
    const user = userEvent.setup();
    // Simulate legacy saved settings without server key
    vi.mocked(window.electronAPI.getSettings).mockResolvedValue({
      general: { ...DEFAULT_SETTINGS.general },
      appearance: { ...DEFAULT_SETTINGS.appearance },
      audio: { ...DEFAULT_SETTINGS.audio },
      downloads: { ...DEFAULT_SETTINGS.downloads },
    } as unknown as AppSettings);

    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('language')).toHaveTextContent('vi');
    });

    await user.click(screen.getByText('Save Server'));

    await waitFor(() => {
      expect(window.electronAPI.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          server: expect.objectContaining({
            serverUrl: 'http://localhost:4545',
            autoConnect: true,
          }),
        })
      );
    });
  });
});
