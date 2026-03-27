import type { ImportResult } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class ImportFolderUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  execute(): Promise<ImportResult> {
    return this.repository.importFolder();
  }
}
