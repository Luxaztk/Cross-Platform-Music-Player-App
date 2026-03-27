import { Playlist } from '@/domain/models/Playlist';
import { PlaylistDetail } from '@/domain/models/PlaylistDetail';
import { IPlaylistRepository } from '@/domain/repositories/IPlaylistRepository';
import playlists from '@/infrastructure/data/playlist.json';
import songs from '@/infrastructure/data/song.json';

export class PlaylistRepository implements IPlaylistRepository {
  async getPlaylists(): Promise<Playlist[]> {
    return playlists.map((p) => ({
      ...p,
      songCount: p.songIds.length,
    }));
  }
  async getPlaylistById(id: string): Promise<PlaylistDetail | null> {
    const playlist = playlists.find((p) => p.id === id);
    if (!playlist) return null;

    const playlistSongs = songs.filter((song) => playlist.songIds.includes(song.id));
    return { ...playlist, songs: playlistSongs, songCount: playlist.songIds.length };
  }
}
