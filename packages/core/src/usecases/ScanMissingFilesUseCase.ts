import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class ScanMissingFilesUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(): Promise<string[]> {
    return this.repository.scanMissingFiles();
  }
}
