import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class DeleteSongsUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(songIds: string[]): Promise<boolean> {
    return this.repository.deleteSongs(songIds);
  }
}
