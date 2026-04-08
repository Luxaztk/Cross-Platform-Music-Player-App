import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class GetLyricsUseCase {
  constructor(private repository: ILibraryRepository) {}

  async execute(songId: string): Promise<string | null> {
    return this.repository.getLyrics(songId);
  }
}
