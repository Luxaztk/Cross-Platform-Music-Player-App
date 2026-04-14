import type { Song } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class PatchSongUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(songId: string, updates: Partial<Song>): Promise<Song | null> {
    return this.repository.patchSong(songId, updates);
  }
}