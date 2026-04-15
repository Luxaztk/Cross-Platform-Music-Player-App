import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class GetLyricsUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(songId: string): Promise<string | null> {
    return this.repository.getLyrics(songId);
  }
}
