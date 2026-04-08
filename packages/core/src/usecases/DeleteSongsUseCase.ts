import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class DeleteSongsUseCase {
  constructor(private repository: ILibraryRepository) {}

  async execute(songIds: string[]): Promise<boolean> {
    return this.repository.deleteSongs(songIds);
  }
}
