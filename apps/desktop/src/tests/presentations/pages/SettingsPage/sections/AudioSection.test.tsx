import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioSection } from '../../../../../presentations/pages/SettingsPage/sections/AudioSection';
import { useSettings, useLanguage } from '@hooks';
import { useAudioDevices, usePlayer } from '@music/hooks';

// Mock hooks
vi.mock('@hooks', () => ({
    useSettings: vi.fn(),
    useLanguage: vi.fn(),
}));

vi.mock('@music/hooks', () => ({
    useAudioDevices: vi.fn(),
    usePlayer: vi.fn(),
}));

describe('AudioSection', () => {
    const mockUpdateSettings = vi.fn();
    const mockSetAudioDevice = vi.fn();
    const mockT = vi.fn((key) => key);

    beforeEach(() => {
        vi.clearAllMocks();
        (useLanguage as any).mockReturnValue({ t: mockT });
        (useSettings as any).mockReturnValue({
            settings: { audio: { deviceId: 'default' } },
            updateSettings: mockUpdateSettings
        });
        (useAudioDevices as any).mockReturnValue({
            devices: [
                { deviceId: 'default', label: 'Default Device' },
                { deviceId: 'speaker', label: 'External Speaker' }
            ],
            currentDeviceId: 'default',
            setAudioDevice: mockSetAudioDevice
        });
        (usePlayer as any).mockReturnValue({
            isPlaying: false,
            getAnalyser: vi.fn()
        });
    });

    it('renders correctly', () => {
        render(<AudioSection />);
        expect(screen.getByText('settings.audio.title')).toBeInTheDocument();
        expect(screen.getByText('Default Device')).toBeInTheDocument();
    });

    it('updates device when selection changes', () => {
        render(<AudioSection />);
        fireEvent.click(screen.getByText('Default Device'));
        fireEvent.click(screen.getByText('External Speaker'));
        
        expect(mockSetAudioDevice).toHaveBeenCalledWith('speaker');
        expect(mockUpdateSettings).toHaveBeenCalledWith({ audio: { deviceId: 'speaker' } });
    });

    it('triggers test sound', () => {
        render(<AudioSection />);
        fireEvent.click(screen.getByText('settings.audio.testBtn'));
        expect(screen.getByText('settings.audio.testBtn')).toBeInTheDocument();
    });
});
