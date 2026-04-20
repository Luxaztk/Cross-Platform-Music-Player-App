import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeneralSection } from '../../../../../presentations/pages/SettingsPage/sections/GeneralSection';
import { useSettings, useLanguage } from '@hooks';

// Mock hooks
vi.mock('@hooks', () => ({
    useSettings: vi.fn(),
    useLanguage: vi.fn(),
}));

describe('GeneralSection Hardened Reactivity', () => {
    const mockUpdateSettings = vi.fn();
    const mockSetLanguage = vi.fn();
    const mockT = vi.fn((key) => {
        const trans: Record<string, string> = {
            'settings.general.title': 'General',
            'settings.general.language': 'Language',
            'settings.general.languageDesc': 'Select your preferred language',
            'settings.general.languageSelect': 'Select Language'
        };
        return trans[key] || key;
    });

    beforeEach(() => {
        vi.clearAllMocks();
        (useLanguage as any).mockReturnValue({
            t: mockT,
            setLanguage: mockSetLanguage,
            language: 'vi'
        });
    });

    it('STRICT: UI label reflects settings state changes (Reactivity Check)', async () => {
        const user = userEvent.setup();
        
        // Setup initial mock state
        (useSettings as any).mockReturnValue({
            settings: { general: { language: 'vi' } },
            updateSettings: mockUpdateSettings,
            resetSettings: vi.fn(),
            isSaving: false
        });

        // Initial render with Vietnamese
        const { rerender } = render(<GeneralSection />);
        
        expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
        
        // Trigger change
        await user.click(screen.getByText('Tiếng Việt'));
        await user.click(screen.getByText('English'));
        
        expect(mockSetLanguage).toHaveBeenCalledWith('en');
        expect(mockUpdateSettings).toHaveBeenCalledWith({ general: { language: 'en' } });
        
        // Simulate parent updating settings state and re-rendering children
        (useSettings as any).mockReturnValue({
            settings: { general: { language: 'en' } },
            updateSettings: mockUpdateSettings,
            resetSettings: vi.fn(),
            isSaving: false
        });
        
        rerender(<GeneralSection />);
        
        // UNFORGIVING ASSERTION: The trigger label MUST now be 'English'
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.queryByText('Tiếng Việt')).not.toBeInTheDocument();
    });
});
