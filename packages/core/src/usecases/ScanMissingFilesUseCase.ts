import type { Song } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class ScanMissingFilesUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(): Promise<Song[]> {
    return this.repository.scanMissingFiles();
  }
}
