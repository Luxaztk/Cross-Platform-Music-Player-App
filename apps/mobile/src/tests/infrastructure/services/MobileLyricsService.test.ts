import { afterEach, describe, expect, it, vi } from 'vitest'

import { MobileLyricsService } from '../../../infrastructure/services/MobileLyricsService'

describe('MobileLyricsService', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes the query and maps usable LRCLIB results', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 42,
          trackName: 'Song',
          artistName: 'Artist',
          albumName: null,
          duration: 120,
          syncedLyrics: '[00:01.00]Hello',
          plainLyrics: 'Hello',
        },
        { id: 43, trackName: 'Empty', artistName: 'Artist', syncedLyrics: null, plainLyrics: null },
        { invalid: true },
      ],
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await MobileLyricsService.search('  Song - Artist  ')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://lrclib.net/api/search?q=Song%20-%20Artist',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
    expect(result).toEqual([
      {
        id: 42,
        trackName: 'Song',
        artistName: 'Artist',
        albumName: '',
        duration: 120,
        syncedLyrics: '[00:01.00]Hello',
        plainLyrics: 'Hello',
      },
    ])
  })

  it('rejects unsuccessful responses and skips empty queries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 })
    vi.stubGlobal('fetch', fetchMock)

    await expect(MobileLyricsService.search('song')).rejects.toThrow('status 503')
    await expect(MobileLyricsService.search('   ')).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
