import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DownloadSection } from '../../../../../presentations/pages/SettingsPage/sections/DownloadSection';
import { useSettings, useLanguage } from '@hooks';

// Mock hooks
vi.mock('@hooks', () => ({
    useSettings: vi.fn(),
    useLanguage: vi.fn(),
}));

describe('DownloadSection', () => {
    const mockUpdateSettings = vi.fn();
    const mockT = vi.fn((key) => key);

    const defaultSettings = { 
        downloads: { 
            bitrate: '320',
            downloadPath: 'C:/Music',
            autoImportPaths: []
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useLanguage as any).mockReturnValue({ t: mockT });
        (useSettings as any).mockReturnValue({
            settings: defaultSettings,
            updateSettings: mockUpdateSettings,
            selectDirectory: vi.fn(),
            isSaving: false
        });
    });

    it('renders correctly', () => {
        render(<DownloadSection />);
        expect(screen.getByText('settings.downloads.title')).toBeInTheDocument();
        expect(screen.getByDisplayValue('C:/Music')).toBeInTheDocument();
    });

    it('updates bitrate when selection changes', () => {
        render(<DownloadSection />);
        fireEvent.click(screen.getByText('320kbps (Best)'));
        fireEvent.click(screen.getByText('128kbps (Standard)'));
        
        expect(mockUpdateSettings).toHaveBeenCalledWith({
            downloads: {
                bitrate: '128',
                downloadPath: 'C:/Music',
                autoImportPaths: []
            }
        });
    });
});
