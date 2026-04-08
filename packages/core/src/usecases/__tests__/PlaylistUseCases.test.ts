import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePlaylistUseCase } from '../CreatePlaylistUseCase';
import { DeletePlaylistUseCase } from '../DeletePlaylistUseCase';
import { UpdatePlaylistUseCase } from '../UpdatePlaylistUseCase';
import { GetPlaylistsUseCase } from '../GetPlaylistsUseCase';
import { GetPlaylistByIdUseCase } from '../GetPlaylistByIdUseCase';
import type { ILibraryRepository } from '../../interfaces/ILibraryRepository';

describe('Playlist UseCases', () => {
  let mockRepository: ILibraryRepository;

  beforeEach(() => {
    mockRepository = {
      createPlaylist: vi.fn(),
      deletePlaylist: vi.fn(),
      updatePlaylist: vi.fn(),
      getPlaylists: vi.fn(),
      getPlaylistById: vi.fn(),
    } as unknown as ILibraryRepository;
  });

  it('CreatePlaylistUseCase should call repository.createPlaylist', async () => {
    const useCase = new CreatePlaylistUseCase(mockRepository);
    const name = 'New Playlist';
    await useCase.execute(name);
    expect(mockRepository.createPlaylist).toHaveBeenCalledWith(name);
  });

  it('DeletePlaylistUseCase should call repository.deletePlaylist', async () => {
    const useCase = new DeletePlaylistUseCase(mockRepository);
    const id = '123';
    await useCase.execute(id);
    expect(mockRepository.deletePlaylist).toHaveBeenCalledWith(id);
  });

  it('UpdatePlaylistUseCase should call repository.updatePlaylist', async () => {
    const useCase = new UpdatePlaylistUseCase(mockRepository);
    const playlist = { 
      id: '123', 
      name: 'Updated Name', 
      songs: [],
      description: '',
      songIds: [],
      createdAt: new Date().toISOString()
    };
    await useCase.execute(playlist);
    expect(mockRepository.updatePlaylist).toHaveBeenCalledWith(playlist);
  });

  it('GetPlaylistsUseCase should call repository.getPlaylists', async () => {
    const useCase = new GetPlaylistsUseCase(mockRepository);
    await useCase.execute();
    expect(mockRepository.getPlaylists).toHaveBeenCalled();
  });

  it('GetPlaylistByIdUseCase should call repository.getPlaylistById', async () => {
    const useCase = new GetPlaylistByIdUseCase(mockRepository);
    const id = '123';
    await useCase.execute(id);
    expect(mockRepository.getPlaylistById).toHaveBeenCalledWith(id);
  });
});
