import type { LyricSearchResult, Song } from '@music/types';
import type { LyricLine } from '@music/core';


export interface UseLyricsPanelReturn {
  state: {
    lyricLines: LyricLine[];
    currentLineIndex: number;
    isLoading: boolean;
    isSearching: boolean;
    searchResults: LyricSearchResult[];
    searchQuery: string;
    offset: number;
    showHint: boolean;
    currentSong: Song | null;
    progress: number;
  };
  refs: {
    scrollRef: React.RefObject<HTMLDivElement | null>;
    activeLineRef: React.RefObject<HTMLDivElement | null>;
  };
  actions: {
    handleSearch: () => Promise<void>;
    selectSearchResult: (lyrics: string, lyricId: number) => Promise<void>;
    handleLineClick: (time: number) => void;
    adjustOffset: (delta: number) => void;
    setOffset: (val: number) => void;
    resetOffset: () => void;
    setSearchQuery: (query: string) => void;
    setSearchResults: (results: LyricSearchResult[]) => void;
  };
  utils: {
    t: (key: string, options?: any) => string;
  };
}

export interface LyricsHeaderProps {
    hasLyrics: boolean;
    showSearch: boolean;
    showHint: boolean;
    offset: number;
    onSearch: () => void;
    onAdjustOffset: (delta: number) => void;
    onSetOffset: (val: number) => void;
    onResetOffset: () => void;
    t: (key: string, options?: any) => string;
}

export interface LyricsContentProps {
    lyricLines: LyricLine[];
    currentLineIndex: number;
    progress: number;
    onLineClick: (time: number) => void;
    onSyncNow: (offset: number) => void;
    activeLineRef: React.RefObject<HTMLDivElement | null>;
    t: (key: string, options?: any) => string;
}

export interface LyricsSearchProps {
    isSearching: boolean;
    searchQuery: string;
    searchResults: LyricSearchResult[];
    currentLyricId?: number;
    onSearchQueryChange: (val: string) => void;
    onSearch: () => void;
    onSelectResult: (lyrics: string, id: number) => void;
    onClose: () => void;
    t: (key: string, options?: any) => string;
}

export interface EmptyLyricsProps {
    isSearching: boolean;
    isLoading: boolean;
    searchQuery: string;
    onSearchQueryChange: (val: string) => void;
    onSearch: () => void;
    t: (key: string, options?: any) => string;
}
