import React from 'react';
import type { SearchResults } from '@hooks';
import type { Song, RecentSearch } from '@music/types';
import type { SearchResultItem } from './SearchOverlay';
import { type ThemeType } from '@components';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  action?: () => void;
  children?: MenuItem[];
  isDivider?: boolean;
  isSelected?: boolean;
  className?: string;
  themeId?: ThemeType;
}

export interface UseHeaderReturn {
    state: {
        searchQuery: string;
        isSearchFocused: boolean;
        selectedIndex: number;
        showProfileMenu: boolean;
        showDownloader: boolean;
        activeMenuStack: string[];
        renderStack: string[];
        menuHeight: number | undefined;
        isSyncing: boolean;
        searchResults: SearchResults;
        flatResults: SearchResultItem[];
        recentSearches: RecentSearch[];
        language: string;
    };
    domNodes: {
        profileRef: React.RefObject<HTMLDivElement | null>;
        searchRef: React.RefObject<HTMLDivElement | null>;
        dropdownRef: React.RefObject<HTMLDivElement | null>;
    };
    actions: {
        setSearchQuery: (val: string) => void;
        setIsSearchFocused: (val: boolean) => void;
        setSelectedIndex: (val: React.SetStateAction<number>) => void;
        setShowProfileMenu: (val: boolean) => void;
        setShowDownloader: (val: boolean) => void;
        handleSelectResult: (result: SearchResultItem) => void;
        handleSelectRecent: (recent: RecentSearch) => void;
        handlePushMenu: (id: string) => void;
        handlePopMenu: (e: React.MouseEvent) => void;
        removeRecentSearch: (timestamp: number) => void;
        clearRecentSearches: () => void;

        playNext: (song: Song) => void;
        addToQueue: (song: Song) => void;
    };
    utils: {
        t: (key: string, options?: Record<string, string | number>) => string;
        menusToRender: ( { id: string; title: string; items: MenuItem[] } | null )[];
    };
}

export interface SearchInputProps {
  searchQuery: string;
  isSearchFocused: boolean;
  onSearchChange: (value: string) => void;
  onFocus: () => void;
  onClear: () => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

export interface ProfileMenuProps {
    isOpen: boolean;
    activeMenuStack: string[];
    menusToRender: ( { id: string; title: string; items: MenuItem[] } | null )[];
    menuHeight: number | undefined;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
    profileRef: React.RefObject<HTMLDivElement | null>;
    onToggle: () => void;
    onPushMenu: (id: string) => void;
    onPopMenu: (e: React.MouseEvent) => void;
    t: (key: string, options?: Record<string, string | number>) => string;
}
