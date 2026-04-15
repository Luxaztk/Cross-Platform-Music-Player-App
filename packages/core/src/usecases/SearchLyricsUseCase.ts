import type { LyricSearchResult } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class SearchLyricsUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(query: string): Promise<LyricSearchResult[]> {
    return this.repository.searchLyrics(query);
  }
}
