import type { Playlist } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class CreatePlaylistUseCase {
  private readonly repository: ILibraryRepository;
  
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(name: string): Promise<Playlist> {
    return this.repository.createPlaylist(name);
  }
}
