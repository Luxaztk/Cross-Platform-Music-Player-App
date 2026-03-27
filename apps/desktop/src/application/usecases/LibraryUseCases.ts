import type { ILibraryRepository } from '../../domain/repositories/ILibraryRepository';
import type { ImportResult, Song, Playlist } from '../../../../../packages/types/index';

export class ImportFilesUseCase {
  private libraryRepository: ILibraryRepository;
  constructor(libraryRepository: ILibraryRepository) {
    this.libraryRepository = libraryRepository;
  }

  execute(): Promise<ImportResult> {
    return this.libraryRepository.importFiles();
  }
}

export class ImportFolderUseCase {
  private libraryRepository: ILibraryRepository;
  constructor(libraryRepository: ILibraryRepository) {
    this.libraryRepository = libraryRepository;
  }

  execute(): Promise<ImportResult> {
    return this.libraryRepository.importFolder();
  }
}

export class GetLibraryUseCase {
  private libraryRepository: ILibraryRepository;
  constructor(libraryRepository: ILibraryRepository) {
    this.libraryRepository = libraryRepository;
  }

  execute(): Promise<{ songs: Song[], library: Playlist }> {
    return this.libraryRepository.getLibrary();
  }
}

export class GetPlaylistsUseCase {
  private libraryRepository: ILibraryRepository;
  constructor(libraryRepository: ILibraryRepository) {
    this.libraryRepository = libraryRepository;
  }

  execute(): Promise<Playlist[]> {
    return this.libraryRepository.getPlaylists();
  }
}
