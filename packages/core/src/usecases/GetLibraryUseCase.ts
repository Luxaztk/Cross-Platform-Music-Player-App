import type { Song, Playlist } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class GetLibraryUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  execute(): Promise<{ songs: Song[]; library: Playlist }> {
    return this.repository.getLibrary();
  }
}
