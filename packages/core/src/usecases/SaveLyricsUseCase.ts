import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class SaveLyricsUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(songId: string, lyrics: string): Promise<boolean> {
    return this.repository.saveLyrics(songId, lyrics);
  }
}
