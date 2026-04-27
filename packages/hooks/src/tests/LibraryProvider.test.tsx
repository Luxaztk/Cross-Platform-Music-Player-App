import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { SharedLibraryProvider } from '../providers/LibraryProvider';
import { useLibraryContext } from '../useLibrary';


import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ILibraryRepository } from '@music/core';
import type { Song, Playlist, DuplicateSongInfo } from '@music/types';

describe('SharedLibraryProvider', () => {
  let mockRepository: ILibraryRepository;
  const mockSongs: Song[] = [
    { id: '1', title: 'Song 1', artist: 'Artist 1', artists: ['Artist 1'], filePath: '/path/1', duration: 100, album: 'Album 1', genre: '', year: 2021, coverArt: null, hash: 'h1', fileSize: 1000 },
  ];
  const mockLibrary: Playlist = { id: '0', name: 'Library', songIds: ['1'], createdAt: '2021-01-01', description: 'All songs' };
  const mockPlaylists: Playlist[] = [
    { id: '1', name: 'Favorites', songIds: [], createdAt: '2021-01-01', description: '' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      getLibrary: vi.fn().mockResolvedValue({ songs: mockSongs, library: mockLibrary }),
      getPlaylists: vi.fn().mockResolvedValue(mockPlaylists),
      importFiles: vi.fn().mockResolvedValue({ success: true, count: 0 }),
      importFolder: vi.fn().mockResolvedValue({ success: true, count: 0 }),
      createPlaylist: vi.fn().mockResolvedValue(mockPlaylists[0]),
      getPlaylistById: vi.fn().mockResolvedValue(mockPlaylists[0]),
      updatePlaylist: vi.fn().mockResolvedValue(mockPlaylists[0]),
      updateSong: vi.fn().mockResolvedValue(mockSongs[0]),
      deleteSong: vi.fn().mockResolvedValue(true),
      deleteSongs: vi.fn().mockResolvedValue(true),
      removeSongsFromPlaylist: vi.fn().mockResolvedValue(true),
      addSongsToPlaylist: vi.fn().mockResolvedValue(true),
      deletePlaylist: vi.fn().mockResolvedValue(true),
      addSongs: vi.fn().mockResolvedValue({ success: true, count: 0 }),
      patchSong: vi.fn().mockResolvedValue(mockSongs[0]),
      runAutoImportScan: vi.fn().mockResolvedValue({ added: 0, migrated: 0, totalScanned: 0, details: [] }),
      scanMissingFiles: vi.fn().mockResolvedValue([]),
      getSettings: vi.fn().mockResolvedValue({ downloads: { autoImportPaths: [] } }),
      getSyncHistory: vi.fn().mockResolvedValue([]),
      clearSyncHistory: vi.fn().mockResolvedValue(undefined),
      logSyncEvent: vi.fn().mockResolvedValue(undefined),
    } as unknown as ILibraryRepository;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SharedLibraryProvider repository={mockRepository}>{children}</SharedLibraryProvider>
  );

  it('should fetch library and playlists on mount', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    // Wait for initial fetch
    await act(async () => {
      let timeout = 0;
      while (result.current.songs.length === 0 && timeout < 2000) {
        await new Promise(resolve => setTimeout(resolve, 50));
        timeout += 50;
      }
    });

    expect(mockRepository.getLibrary).toHaveBeenCalled();
    expect(mockRepository.getPlaylists).toHaveBeenCalled();
    expect(result.current.songs).toEqual(mockSongs);
    expect(result.current.playlists).toEqual(mockPlaylists);
  });

  it('should handle playlist creation', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    await act(async () => {
      await result.current.handleCreatePlaylist('Cool List');
    });

    expect(mockRepository.createPlaylist).toHaveBeenCalledWith('Cool List');
    expect(mockRepository.getPlaylists).toHaveBeenCalledTimes(2); // Initial + After creation
  });

  it('should handle importing files', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });
    
    vi.mocked(mockRepository.importFiles).mockResolvedValue({ 
      success: true, 
      count: 2, 
      duplicateSongs: [{ id: 'dup1', title: 'Duplicate' } as DuplicateSongInfo] 
    });

    await act(async () => {
       await result.current.handleImportFiles();
    });

    expect(mockRepository.importFiles).toHaveBeenCalled();
    expect(result.current.duplicateSongs).toHaveLength(1);
    expect(mockRepository.getLibrary).toHaveBeenCalledTimes(2); // Initial + After import
  });

  it('should handle song updates', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    await act(async () => {
      await result.current.handleUpdateSong(mockSongs[0]);
    });

    expect(mockRepository.updateSong).toHaveBeenCalledWith(mockSongs[0]);
    expect(mockRepository.getLibrary).toHaveBeenCalledTimes(2);
  });

  it('should handle scan missing files', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });
    
    // Wait for hydration
    await act(async () => {
      let timeout = 0;
      while (result.current.songs.length === 0 && timeout < 2000) {
        await new Promise(resolve => setTimeout(resolve, 50));
        timeout += 50;
      }
    });

    await act(async () => {
      await result.current.handleScanMissingFiles();
    });

    expect(mockRepository.scanMissingFiles).toHaveBeenCalled();
  });

  it('should handle deleting a song', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    await act(async () => {
      const success = await result.current.handleDeleteSong('1');
      expect(success).toBe(true);
    });

    expect(mockRepository.deleteSong).toHaveBeenCalledWith('1');
    expect(mockRepository.getLibrary).toHaveBeenCalledTimes(2);
  });

  it('should handle deleting multiple songs', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    await act(async () => {
      const success = await result.current.handleDeleteSongs(['1', '2']);
      expect(success).toBe(true);
    });

    expect(mockRepository.deleteSongs).toHaveBeenCalledWith(['1', '2']);
    expect(mockRepository.getLibrary).toHaveBeenCalledTimes(2);
  });

  it('should handle removing songs from playlist', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    await act(async () => {
      const success = await result.current.handleRemoveSongsFromPlaylist('p1', ['s1']);
      expect(success).toBe(true);
    });

    expect(mockRepository.removeSongsFromPlaylist).toHaveBeenCalledWith('p1', ['s1']);
  });

  it('should handle adding songs to playlist', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    await act(async () => {
      const success = await result.current.handleAddSongsToPlaylist('p1', ['s1']);
      expect(success).toBe(true);
    });

    expect(mockRepository.addSongsToPlaylist).toHaveBeenCalledWith('p1', ['s1']);
  });

  it('should handle deleting a playlist', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    await act(async () => {
      const success = await result.current.handleDeletePlaylist('p1');
      expect(success).toBe(true);
    });

    expect(mockRepository.deletePlaylist).toHaveBeenCalledWith('p1');
    expect(mockRepository.getPlaylists).toHaveBeenCalledTimes(2);
  });
  it('should handle adding songs to library', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    await act(async () => {
      const res = await result.current.handleAddSongs(mockSongs);
      expect(res.success).toBe(true);
    });

    expect(mockRepository.addSongs).toHaveBeenCalledWith(mockSongs);
    expect(mockRepository.getLibrary).toHaveBeenCalledTimes(2);
  });

  it('should handle importing a folder with content and duplicates', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    vi.mocked(mockRepository.importFolder).mockResolvedValue({ 
      success: true, 
      count: 5,
      duplicateSongs: [{ id: 'dup1', title: 'Duplicate' } as DuplicateSongInfo]
    });

    await act(async () => {
      await result.current.handleImportFolder();
    });

    expect(mockRepository.importFolder).toHaveBeenCalled();
    expect(mockRepository.getLibrary).toHaveBeenCalledTimes(2);
    expect(result.current.duplicateSongs).toHaveLength(1);
  });

  it('should handle getting playlist detail', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    await act(async () => {
      const detail = await result.current.handleGetPlaylistDetail('p1');
      expect(detail).not.toBeNull();
      expect(detail?.id).toBe('1');
    });

    expect(mockRepository.getPlaylistById).toHaveBeenCalledWith('p1');
  });

  it('should handle updating a playlist', async () => {
    const { result } = renderHook(() => useLibraryContext(), { wrapper });

    await act(async () => {
      await result.current.handleUpdatePlaylist(mockPlaylists[0]);
    });

    expect(mockRepository.updatePlaylist).toHaveBeenCalledWith(mockPlaylists[0]);
  });

  it('should throw error when used outside of LibraryProvider', () => {
    // Suppress console.error for this expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => renderHook(() => useLibraryContext())).toThrow('useLibrary must be used within a SharedLibraryProvider');
    
    spy.mockRestore();
  });

  describe('Sync System Orchestration', () => {
    it('should run auto-import scan before missing files scan in handleSyncLibrary', async () => {
      const { result } = renderHook(() => useLibraryContext(), { wrapper });
      
      const callOrder: string[] = [];
      vi.mocked(mockRepository.runAutoImportScan).mockImplementation(async () => {
        callOrder.push('auto-import');
        return { added: 1, migrated: 0, totalScanned: 1, details: ['Added 1'] };
      });
      vi.mocked(mockRepository.scanMissingFiles).mockImplementation(async () => {
        callOrder.push('scan-missing');
        return [];
      });

      await act(async () => {
        await result.current.handleSyncLibrary();
      });

      expect(callOrder).toEqual(['auto-import', 'scan-missing']);
      expect(mockRepository.logSyncEvent).toHaveBeenCalledWith(
        { added: 1, migrated: 0, deleted: 0 },
        ['Added 1']
      );
    });

    it('should update missingSongs and showCleanupModal if missing files are found', async () => {
      const { result } = renderHook(() => useLibraryContext(), { wrapper });
      
      const missing = [mockSongs[0]];
      vi.mocked(mockRepository.scanMissingFiles).mockResolvedValue(missing);

      await act(async () => {
        await result.current.handleSyncLibrary();
      });

      expect(result.current.missingSongs).toEqual(missing);
      expect(result.current.showCleanupModal).toBe(true);
    });

    it('should NOT show cleanup modal if isSilent is true', async () => {
      const { result } = renderHook(() => useLibraryContext(), { wrapper });
      
      vi.mocked(mockRepository.scanMissingFiles).mockResolvedValue([mockSongs[0]]);

      await act(async () => {
        await result.current.handleSyncLibrary({ isSilent: true });
      });


      expect(result.current.showCleanupModal).toBe(false);
    });

    it('should handle confirm cleanup and log deleted songs', async () => {
      const { result } = renderHook(() => useLibraryContext(), { wrapper });
      
      // Setup missing songs state first
      vi.mocked(mockRepository.scanMissingFiles).mockResolvedValue([mockSongs[0]]);
      await act(async () => {
        await result.current.handleSyncLibrary();
      });

      vi.mocked(mockRepository.deleteSongs).mockResolvedValue(true);

      await act(async () => {
        const success = await result.current.handleConfirmCleanup([mockSongs[0].id]);
        expect(success).toBe(true);
      });

      expect(mockRepository.deleteSongs).toHaveBeenCalledWith([mockSongs[0].id]);
      expect(mockRepository.logSyncEvent).toHaveBeenCalledWith(
        { added: 0, migrated: 0, deleted: 1 },
        [`[Deleted] ${mockSongs[0].title}`]
      );
      expect(result.current.missingSongs).toHaveLength(0);
      expect(result.current.showCleanupModal).toBe(false);
    });
  });
});
