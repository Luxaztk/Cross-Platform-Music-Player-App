import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class AddSongsToPlaylistUseCase {
  constructor(private repository: ILibraryRepository) {}

  async execute(playlistId: string, songIds: string[]): Promise<boolean> {
    return this.repository.addSongsToPlaylist(playlistId, songIds);
  }
}
