import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateSongUseCase } from '../UpdateSongUseCase';
import { DeleteSongUseCase } from '../DeleteSongUseCase';
import { ImportFilesUseCase } from '../ImportFilesUseCase';
import { ImportFolderUseCase } from '../ImportFolderUseCase';
import type { ILibraryRepository } from '../../interfaces/ILibraryRepository';
import type { Song } from '@music/types';

describe('Song UseCases', () => {
  let mockRepository: ILibraryRepository;

  beforeEach(() => {
    mockRepository = {
      updateSong: vi.fn(),
      deleteSong: vi.fn(),
      importFiles: vi.fn(),
      importFolder: vi.fn(),
    } as unknown as ILibraryRepository;
  });

  it('UpdateSongUseCase should call repository.updateSong', async () => {
    const useCase = new UpdateSongUseCase(mockRepository);
    const song = { id: '1', title: 'Song' } as Song;
    await useCase.execute(song);
    expect(mockRepository.updateSong).toHaveBeenCalledWith(song);
  });

  it('DeleteSongUseCase should call repository.deleteSong', async () => {
    const useCase = new DeleteSongUseCase(mockRepository);
    const id = '1';
    await useCase.execute(id);
    expect(mockRepository.deleteSong).toHaveBeenCalledWith(id);
  });

  it('ImportFilesUseCase should call repository.importFiles', async () => {
    const useCase = new ImportFilesUseCase(mockRepository);
    await useCase.execute();
    expect(mockRepository.importFiles).toHaveBeenCalled();
  });

  it('ImportFolderUseCase should call repository.importFolder', async () => {
    const useCase = new ImportFolderUseCase(mockRepository);
    await useCase.execute();
    expect(mockRepository.importFolder).toHaveBeenCalled();
  });
});
