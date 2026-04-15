import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class RemoveSongsFromPlaylistUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(playlistId: string, songIds: string[]): Promise<boolean> {
    return this.repository.removeSongsFromPlaylist(playlistId, songIds);
  }
}
