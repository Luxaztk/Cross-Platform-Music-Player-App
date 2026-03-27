import { Playlist } from '../models/Playlist';
import { PlaylistDetail } from '../models/PlaylistDetail';

export interface IPlaylistRepository {
  getPlaylists(): Promise<Playlist[]>;
  getPlaylistById(id: string): Promise<PlaylistDetail | null>;
}
