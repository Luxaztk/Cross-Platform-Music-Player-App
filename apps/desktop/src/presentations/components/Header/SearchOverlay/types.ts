import React from 'react';
import { type Song, type RecentSearch } from '@music/types';
import { type SearchResults } from '@hooks';


export type SearchResultItem =
  | { type: 'song'; item: Song }
  | { type: 'artist'; item: SearchResults['artists'][number] }
  | { type: 'album'; item: SearchResults['albums'][number] };

export interface SearchOverlayProps {
  query: string;
  results: SearchResults;
  recentSearches: RecentSearch[];
  selectedIndex: number;
  onSelect: (item: SearchResultItem) => void;
  onSelectRecent: (recent: RecentSearch) => void;
  onRemoveRecent: (timestamp: number) => void;
  onClearRecent: () => void;
  onPlayNext: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
}

export interface UseSearchOverlayReturn {
    state: {
        activeMenuId: string | null;
        menuPlacement: 'top' | 'bottom';
        clusteredSongs: {
            titles: Song[];
            artists: Song[];
            albums: Song[];
        };
        flatResults: SearchResultItem[];
        isTrulyEmpty: boolean;
        appIcon: string;
    };
    refs: {
        contentRef: React.RefObject<HTMLDivElement | null>;
        menuRef: React.RefObject<HTMLDivElement | null>;
    };
    actions: {
        setActiveMenuId: (id: string | null) => void;
        setMenuPlacement: (p: 'top' | 'bottom') => void;
        handleMoreClick: (e: React.MouseEvent, songId: string) => void;
    };
    utils: {
        t: (key: string, options?: any) => string;
    };
}
