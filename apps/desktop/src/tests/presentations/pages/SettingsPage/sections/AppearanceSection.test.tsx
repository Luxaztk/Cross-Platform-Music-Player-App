import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppearanceSection } from '../../../../../presentations/pages/SettingsPage/sections/AppearanceSection';
import { useTheme, useLanguage } from '@hooks';

// Mock hooks
vi.mock('@hooks', () => ({
    useTheme: vi.fn(),
    useLanguage: vi.fn(),
}));

describe('AppearanceSection', () => {
    const mockSetTheme = vi.fn();
    const mockT = vi.fn((key) => key);

    beforeEach(() => {
        vi.clearAllMocks();
        (useLanguage as any).mockReturnValue({ t: mockT });
        (useTheme as any).mockReturnValue({
            theme: 'midnight',
            setTheme: mockSetTheme
        });
    });

    it('renders correctly', () => {
        render(<AppearanceSection />);
        expect(screen.getByText('settings.appearance.title')).toBeInTheDocument();
        // Check for theme labels
        expect(screen.getByText('settings.appearance.themeMidnight')).toBeInTheDocument();
    });

    it('updates theme when a theme card is clicked', () => {
        render(<AppearanceSection />);
        // Click on the 'sunset' (or rose) theme card
        const roseCard = screen.getByText('settings.appearance.themeRose').closest('.theme-card');
        if (roseCard) fireEvent.click(roseCard);
        
        expect(mockSetTheme).toHaveBeenCalledWith('rose');
    });
});
