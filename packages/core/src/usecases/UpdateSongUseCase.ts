import type { Song } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class UpdateSongUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(song: Song): Promise<Song> {
    return this.repository.updateSong(song);
  }
}
