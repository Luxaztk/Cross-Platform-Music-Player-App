import { PlaylistDetail } from '@/domain/models/PlaylistDetail';
import { IPlaylistRepository } from '@/domain/repositories/IPlaylistRepository';

export class GetPlaylistById {
  constructor(private repo: IPlaylistRepository) {}

  execute(id: string): Promise<PlaylistDetail | null> {
    return this.repo.getPlaylistById(id);
  }
}
