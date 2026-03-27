import type { Playlist } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class GetPlaylistsUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  execute(): Promise<Playlist[]> {
    return this.repository.getPlaylists();
  }
}
