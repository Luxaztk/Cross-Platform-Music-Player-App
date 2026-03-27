import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class DeleteSongUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(songId: string): Promise<boolean> {
    return this.repository.deleteSong(songId);
  }
}
