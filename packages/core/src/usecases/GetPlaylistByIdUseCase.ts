import type { PlaylistDetail } from '@music/types';
import type { ILibraryRepository } from '../interfaces/ILibraryRepository';

export class GetPlaylistByIdUseCase {
  private repository: ILibraryRepository;
  constructor(repository: ILibraryRepository) {
    this.repository = repository;
  }

  execute(id: string): Promise<PlaylistDetail | null> {
    return this.repository.getPlaylistById(id);
  }
}
