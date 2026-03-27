export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  songIds: string[];
  songCount: number;
  createdAt: string;
}
