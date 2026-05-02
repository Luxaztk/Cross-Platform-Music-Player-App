import type { PlaylistDetail, Song, Playlist } from '@music/types';

export interface UsePlaylistDetailReturn {
  state: {
    playlist: PlaylistDetail | null;
    localSongs: Song[];
    filteredSongs: Song[];
    visibleSongs: Song[];
    selectedIds: Set<string>;
    activeMenuId: string | null;
    activeSubMenuId: string | null;
    menuPosition: { top: number; right: number; placement: 'top' | 'bottom' };
    scrollTop: number;
    isHeaderSticky: boolean;
    isEditModalOpen: boolean;
    isImporting: boolean;
    isLoading: boolean;
    isSongPickerOpen: boolean;
    isDebouncing: boolean;
    editingSong: Song | null;
    deletingSong: Song | null;
    bulkDeleteMode: 'library' | 'playlist' | null;
    isLibrary: boolean;
    totalDuration: number;
    totalHeight: number;
    paddingOffset: number;
    startIndex: number;
  };
  refs: {
    containerRef: React.RefObject<HTMLDivElement | null>;
    menuRef: React.RefObject<HTMLDivElement | null>;
  };
  actions: {
    onSaveMetadata: (updated: Song | Playlist) => Promise<void>;
    onDeleteSong: (song: Song) => void;
    confirmDeleteSong: () => Promise<void>;
    confirmBulkDelete: () => Promise<void>;
    toggleSelect: (songId: string, e?: React.MouseEvent) => void;
    toggleSelectAll: () => void;
    onBulkAddToQueue: () => void;
    toggleFilter: (type: 'artist' | 'album', value: string) => void;
    onImportFiles: () => Promise<void>;
    onImportFolder: () => Promise<void>;
    onAddFromSystem: () => void;
    onAddSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<void>;
    toggleMenu: (sid: string, e: React.MouseEvent) => void;
    setLibraryFilter: (filter: { type: 'artist' | 'album' | 'none'; values: string[] }) => void;
    setIsEditModalOpen: (open: boolean) => void;
    setEditingSong: (song: Song | null) => void;
    setDeletingSong: (song: Song | null) => void;
    setBulkDeleteMode: (mode: 'library' | 'playlist' | null) => void;
    setIsSongPickerOpen: (open: boolean) => void;
    setSelectedIds: (ids: Set<string>) => void;
    setActiveMenuId: (id: string | null) => void;
    setActiveSubMenuId: (id: string | null) => void;
    playList: (songs: Song[], index: number) => void;
    playNext: (song: Song) => void;
    addToQueue: (song: Song) => void;
  };
  utils: {
    t: (key: string, options?: any) => string;
    appIcon: string;
    playlists: Playlist[];
    allSongs: Song[];
    currentSong: Song | null;
    id: string | undefined;
    libraryFilter: { type: 'artist' | 'album' | 'none'; values: string[] };
  };
}

export interface PlaylistHeaderProps {
    isLoading: boolean;
    isLibrary: boolean;
    playlist: PlaylistDetail | null;
    localSongsCount: number;
    filteredSongsCount: number;
    libraryFilterType: string;
    totalDuration: number;
    isImporting: boolean;
    appIcon: string;
    onImportFiles: () => void;
    onImportFolder: () => void;
    onAddFromSystem: () => void;
    onEditPlaylist: () => void;
    t: (key: string, options?: any) => string;
}

export interface FilterChipsProps {
    filter: { type: 'artist' | 'album' | 'none'; values: string[] };
    onRemoveTag: (val: string) => void;
    t: (key: string, options?: any) => string;
}

export interface SongListHeaderProps {
    isSticky: boolean;
    isSelectedAll: boolean;
    onToggleSelectAll: () => void;
    t: (key: string, options?: any) => string;
}

export interface VirtualSongListProps {
    isDebouncing: boolean;
    filteredSongs: Song[];
    visibleSongs: Song[];
    startIndex: number;
    totalHeight: number;
    paddingOffset: number;
    selectedIds: Set<string>;
    currentSongId?: string;
    activeMenuId: string | null;
    playlists: Playlist[];
    currentPlaylistId?: string;
    appIcon: string;
    onToggleSelect: (id: string, e?: React.MouseEvent) => void;
    onPlay: (index: number) => void;
    onPlayNext: (song: Song) => void;
    onAddToQueue: (song: Song) => void;
    onAddToPlaylist: (pid: string, songIds: string[]) => void;

    onEdit: (song: Song) => void;
    onDelete: (song: Song) => void;
    onToggleFilter: (type: 'artist' | 'album', value: string) => void;
    onToggleMenu: (sid: string, e: React.MouseEvent) => void;
    t: (key: string, options?: any) => string;
}

export interface BulkActionsBarProps {
    selectedCount: number;
    isLibrary: boolean;
    onBulkDelete: (mode: 'library' | 'playlist') => void;
    onBulkAddToQueue: () => void;
    onCancel: () => void;
    t: (key: string, options?: any) => string;
}
