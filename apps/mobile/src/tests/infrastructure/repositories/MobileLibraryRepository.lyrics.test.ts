import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Song } from '@music/types'

import { MobileLibraryRepository } from '../../../infrastructure/repositories/MobileLibraryRepository'
import { MobileLyricsService } from '../../../infrastructure/services/MobileLyricsService'
import type { MobileStorageAdapter } from '../../../infrastructure/storage/MobileStorageAdapter'

function song(overrides: Partial<Song> = {}): Song {
  return {
    id: 'song-1',
    filePath: 'file://song.mp3',
    title: 'Song',
    artist: 'Artist',
    artists: ['Artist'],
    album: '',
    duration: 120,
    genre: '',
    year: null,
    coverArt: null,
    ...overrides,
  }
}

describe('MobileLibraryRepository lyrics', () => {
  const storage = {
    getSongs: vi.fn(),
    patchSong: vi.fn(),
    getLyricUsage: vi.fn(),
    saveLyricUsage: vi.fn(),
  }
  let repository: MobileLibraryRepository

  beforeEach(() => {
    vi.restoreAllMocks()
    Object.values(storage).forEach((mock) => mock.mockReset())
    repository = new MobileLibraryRepository(storage as unknown as MobileStorageAdapter)
  })

  it('reads stored synced lyrics before plain lyrics', async () => {
    storage.getSongs.mockResolvedValue({
      'song-1': song({ syncedLyrics: '[00:01.00]Synced', lyrics: 'Plain' }),
    })

    await expect(repository.getLyrics('song-1')).resolves.toBe('[00:01.00]Synced')
    await expect(repository.getLyrics('missing')).resolves.toBeNull()
  })

  it('persists selected lyrics and increments result usage', async () => {
    storage.patchSong.mockResolvedValue(song({ syncedLyrics: 'Lyrics', lyricId: 42 }))
    storage.getLyricUsage.mockResolvedValue({ '42': 2 })

    await expect(repository.saveLyrics('song-1', 'Lyrics', 42)).resolves.toBe(true)
    expect(storage.patchSong).toHaveBeenCalledWith('song-1', { syncedLyrics: 'Lyrics', lyricId: 42 })
    expect(storage.saveLyricUsage).toHaveBeenCalledWith({ '42': 3 })
  })

  it('sorts search results by usage and then synchronized lyrics', async () => {
    vi.spyOn(MobileLyricsService, 'search').mockResolvedValue([
      { id: 1, trackName: 'One', artistName: 'A', albumName: '', duration: 1, syncedLyrics: '', plainLyrics: 'One' },
      { id: 2, trackName: 'Two', artistName: 'A', albumName: '', duration: 1, syncedLyrics: '[00:01.00]Two', plainLyrics: 'Two' },
    ])
    storage.getLyricUsage.mockResolvedValue({ '1': 3, '2': 1 })

    const result = await repository.searchLyrics('query')
    expect(result.map((item) => item.id)).toEqual([1, 2])
  })
})
