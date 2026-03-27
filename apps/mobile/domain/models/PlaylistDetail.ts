import { Playlist } from './Playlist';
import { Song } from './Song';

export interface PlaylistDetail extends Playlist {
  songs: Song[];
}
