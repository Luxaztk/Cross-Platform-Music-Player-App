import type { LyricSearchResult } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class SearchLyricsUseCase {
  constructor(private repository: ILibraryRepository) {}

  async execute(query: string): Promise<LyricSearchResult[]> {
    return this.repository.searchLyrics(query);
  }
}
