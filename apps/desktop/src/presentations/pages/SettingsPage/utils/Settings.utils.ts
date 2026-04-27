import { textMatches } from '../../../../application/utils/searchUtils';

/**
 * Base props interface for all settings sections.
 */
export interface SettingsSectionProps {
    searchQuery?: string;
}

/**
 * Shared helper to check if text matches the search query across settings sections.
 * This ensures consistent behavior (lowercase, trim, diacritics removal) 
 * by relying on centralized searchUtils.
 */
export const matchesSearch = (text: string, searchQuery?: string): boolean => {
    if (!searchQuery) return true;
    return textMatches(text, searchQuery);
};
