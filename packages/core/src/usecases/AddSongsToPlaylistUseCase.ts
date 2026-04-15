import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class AddSongsToPlaylistUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  async execute(playlistId: string, songIds: string[]): Promise<boolean> {
    return this.repository.addSongsToPlaylist(playlistId, songIds);
  }
}
