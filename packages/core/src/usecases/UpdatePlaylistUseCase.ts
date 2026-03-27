import type { Playlist } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class UpdatePlaylistUseCase {
  private readonly repository: ILibraryRepository;
  
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(playlist: Playlist): Promise<Playlist> {
    return this.repository.updatePlaylist(playlist);
  }
}
