import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetLibraryUseCase } from '../GetLibraryUseCase';
import type { ILibraryRepository } from '../../interfaces/ILibraryRepository';

describe('Library UseCases', () => {
  let mockRepository: ILibraryRepository;

  beforeEach(() => {
    mockRepository = {
      getLibrary: vi.fn(),
    } as unknown as ILibraryRepository;
  });

  it('GetLibraryUseCase should call repository.getLibrary', async () => {
    const useCase = new GetLibraryUseCase(mockRepository);
    await useCase.execute();
    expect(mockRepository.getLibrary).toHaveBeenCalled();
  });
});
