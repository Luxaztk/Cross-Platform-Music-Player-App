import type { Song, Playlist, ImportResult } from '../../../../../packages/types/index';

export interface ILibraryRepository {
  getLibrary(): Promise<{ songs: Song[], library: Playlist }>;
  getPlaylists(): Promise<Playlist[]>;
  importFiles(): Promise<ImportResult>;
  importFolder(): Promise<ImportResult>;
}
