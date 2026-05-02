import type { Playlist } from '@music/types';

export type SortMode = 'az' | 'za' | 'default';

export interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export interface UseSidebarReturn {
    state: {
        activeMenuId: string | null;
        menuPlacement: 'top' | 'bottom';
        editingPlaylist: Playlist | null;
        deletingPlaylist: Playlist | null;
        playlistQuery: string;
        isSearchExpanded: boolean;
        sortMode: SortMode;
        isSortMenuOpen: boolean;
        isDebouncing: boolean;
    };
    playlists: {
        all: Playlist[];
        filtered: Playlist[];
        sorted: Playlist[];
    };
    refs: {
        menuRef: React.RefObject<HTMLDivElement | null>;
        sortMenuRef: React.RefObject<HTMLDivElement | null>;
        searchInputRef: React.RefObject<HTMLInputElement | null>;
    };
    actions: {
        setActiveMenuId: (id: string | null) => void;
        setIsSortMenuOpen: (open: boolean) => void;
        setEditingPlaylist: (p: Playlist | null) => void;
        setDeletingPlaylist: (p: Playlist | null) => void;
        setPlaylistQuery: (q: string) => void;
        onCreatePlaylist: () => Promise<void>;
        onEditPlaylist: (e: React.MouseEvent, playlist: Playlist) => void;
        onDeletePlaylist: (e: React.MouseEvent, playlist: Playlist) => void;
        confirmDeletePlaylist: () => Promise<void>;
        handleUpdatePlaylist: (p: Playlist) => Promise<void>;
        onImportFiles: (e: React.MouseEvent) => Promise<void>;
        onImportFolder: (e: React.MouseEvent) => Promise<void>;
        toggleMenu: (e: React.MouseEvent, playlistId: string) => void;
        handleSearchToggle: (e: React.MouseEvent) => void;
        handleSearchBlur: () => void;
        setSortMode: (mode: SortMode) => void;
    };
    utils: {
        t: (key: string) => string;
        appIcon: string;
    };
}

export interface BaseSidebarSectionProps {
    isVisible: boolean;
}

export interface LibrarySectionProps extends BaseSidebarSectionProps {
    activeMenuId: string | null;
    menuPlacement: 'top' | 'bottom';
    menuRef: React.RefObject<HTMLDivElement | null>;
    onToggleMenu: (e: React.MouseEvent, id: string) => void;
    onImportFiles: (e: React.MouseEvent) => Promise<void>;
    onImportFolder: (e: React.MouseEvent) => Promise<void>;
    onToggleSidebar: () => void;
    appIcon: string;
    t: (key: string) => string;
}

export interface PlaylistSectionProps extends BaseSidebarSectionProps {
    playlists: Playlist[];
    query: string;
    isSearchExpanded: boolean;
    isDebouncing: boolean;
    sortMode: SortMode;
    isSortMenuOpen: boolean;
    activeMenuId: string | null;
    menuPlacement: 'top' | 'bottom';
    menuRef: React.RefObject<HTMLDivElement | null>;
    sortMenuRef: React.RefObject<HTMLDivElement | null>;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    onQueryChange: (q: string) => void;
    onSearchToggle: (e: React.MouseEvent) => void;
    onSearchBlur: () => void;
    onToggleSortMenu: (open: boolean) => void;
    onSortChange: (mode: SortMode) => void;
    onCreatePlaylist: () => Promise<void>;
    onToggleMenu: (e: React.MouseEvent, id: string) => void;
    onEditPlaylist: (e: React.MouseEvent, p: Playlist) => void;
    onDeletePlaylist: (e: React.MouseEvent, p: Playlist) => void;
    appIcon: string;
    t: (key: string) => string;
}

export interface PlaylistItemProps {
    playlist: Playlist;
    isActive: boolean;
    isMenuOpen: boolean;
    menuPlacement: 'top' | 'bottom';
    menuRef: React.RefObject<HTMLDivElement | null>;
    onToggleMenu: (e: React.MouseEvent, id: string) => void;
    onEdit: (e: React.MouseEvent, p: Playlist) => void;
    onDelete: (e: React.MouseEvent, p: Playlist) => void;
    appIcon: string;
    t: (key: string) => string;
}

export interface SidebarMiniProps extends BaseSidebarSectionProps {
    playlists: Playlist[];
    onToggle: () => void;
    onCreatePlaylist: () => Promise<void>;
    appIcon: string;
    t: (key: string) => string;
}
