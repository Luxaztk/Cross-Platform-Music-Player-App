import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class RemoveSongsFromPlaylistUseCase {
  constructor(private repository: ILibraryRepository) {}

  async execute(playlistId: string, songIds: string[]): Promise<boolean> {
    return this.repository.removeSongsFromPlaylist(playlistId, songIds);
  }
}
