import type { ImportResult } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class ImportFilesUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  execute(): Promise<ImportResult> {
    return this.repository.importFiles();
  }
}
