import { PlaylistRepository } from '@/infrastructure/repositories/PlaylistRepository';

export class GetPlaylists {
  constructor(private repo: PlaylistRepository) {}

  execute() {
    return this.repo.getPlaylists();
  }
}
