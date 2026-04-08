import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class SaveLyricsUseCase {
  constructor(private repository: ILibraryRepository) {}

  async execute(songId: string, lyrics: string): Promise<boolean> {
    return this.repository.saveLyrics(songId, lyrics);
  }
}
