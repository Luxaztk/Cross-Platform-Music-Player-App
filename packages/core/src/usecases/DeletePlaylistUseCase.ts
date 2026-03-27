import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class DeletePlaylistUseCase {
  private readonly repository: ILibraryRepository;
  
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(playlistId: string): Promise<boolean> {
    return this.repository.deletePlaylist(playlistId);
  }
}
