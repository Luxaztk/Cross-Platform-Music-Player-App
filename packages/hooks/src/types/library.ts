import type { ReactNode } from 'react';
import type { Song, Playlist, PlaylistDetail, DuplicateSongInfo, SyncHistoryEntry, SyncStats } from '@music/types';
import type { ILibraryRepository } from '@music/core';

export interface SyncOptions {
  isSilent?: boolean;
}

export interface LibraryDataContextType {
  songs: Song[];
  library: Playlist | null;
  playlists: Playlist[];
  duplicateSongs: DuplicateSongInfo[];
  libraryVersion: number;
  libraryFilter: { type: 'artist' | 'album' | 'none'; values: string[] };
  isSyncing: boolean;
  missingSongs: Song[];
  showCleanupModal: boolean;
}

export interface LibraryActionsContextType {
  setLibraryFilter: (filter: { type: 'artist' | 'album' | 'none'; values: string[] }) => void;
  handleImportFiles: () => Promise<any>;
  handleImportFolder: () => Promise<any>;
  handleAddSongs: (songs: Song[]) => Promise<{ success: boolean; count: number }>;
  clearDuplicates: () => void;
  handleCreatePlaylist: (name?: string) => Promise<Playlist | null>;
  handleGetPlaylistDetail: (id: string) => Promise<PlaylistDetail | null>;
  handleUpdatePlaylist: (playlist: Playlist) => Promise<Playlist | null>;
  handleUpdateSong: (song: Song) => Promise<Song | null>;
  handlePatchSong: (songId: string, updates: Partial<Song>) => Promise<Song | null>;
  handleDeleteSong: (songId: string) => Promise<boolean>;
  handleDeleteSongs: (songIds: string[]) => Promise<boolean>;
  handleRemoveSongsFromPlaylist: (playlistId: string, songIds: string[]) => Promise<boolean>;
  handleAddSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<boolean>;
  handleDeletePlaylist: (playlistId: string) => Promise<boolean>;
  refreshPlaylists: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  handleScanMissingFiles: () => Promise<Song[]>;
  handleRunAutoImportScan: (paths: string[]) => Promise<{ added: number; migrated: number; totalScanned: number; details: string[] }>;
  handleSyncLibrary: (options?: SyncOptions) => Promise<void>;
  handleConfirmCleanup: (selectedIds: string[]) => Promise<boolean>;
  getSyncHistory: () => Promise<SyncHistoryEntry[]>;
  clearSyncHistory: () => Promise<void>;
  logSyncEvent: (stats: SyncStats, details: string[]) => Promise<void>;
  setShowCleanupModal: (show: boolean) => void;
  repository: ILibraryRepository;
}

export interface SharedLibraryProviderProps {
  children: ReactNode;
  repository: ILibraryRepository;
  onSyncComplete?: (
    result: { added: number; migrated: number; missingCount: number },
    actions: { setShowCleanupModal: (show: boolean) => void }
  ) => void;
  onSyncStart?: (options: SyncOptions) => void;
  onSyncError?: (error: any, actions: { setShowCleanupModal: (show: boolean) => void }) => void;
}
