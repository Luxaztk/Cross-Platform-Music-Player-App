import type { LyricSearchResult } from '@music/types'
import { normalizeNFC } from '@music/utils'

const LRCLIB_SEARCH_URL = 'https://lrclib.net/api/search'
const SEARCH_TIMEOUT_MS = 10_000

type LrclibItem = {
  id: number
  trackName: string
  artistName: string
  albumName: string
  duration: number
  syncedLyrics: string | null
  plainLyrics: string | null
}

function isLrclibItem(value: unknown): value is LrclibItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'number' && typeof item.trackName === 'string' && typeof item.artistName === 'string'
}

function toSearchResult(item: LrclibItem): LyricSearchResult {
  return {
    id: item.id,
    trackName: item.trackName,
    artistName: item.artistName,
    albumName: item.albumName ?? '',
    duration: item.duration ?? 0,
    syncedLyrics: item.syncedLyrics ?? '',
    plainLyrics: item.plainLyrics ?? '',
  }
}

export class MobileLyricsService {
  static async search(query: string): Promise<LyricSearchResult[]> {
    const normalizedQuery = normalizeNFC(query).trim()
    if (!normalizedQuery) return []
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
    try {
      const response = await fetch(`${LRCLIB_SEARCH_URL}?q=${encodeURIComponent(normalizedQuery)}`, { signal: controller.signal })
      if (!response.ok) throw new Error(`LRCLIB request failed with status ${response.status}`)
      const payload: unknown = await response.json()
      if (!Array.isArray(payload)) return []
      return payload.filter(isLrclibItem).map(toSearchResult).filter((item) => Boolean(item.syncedLyrics || item.plainLyrics))
    } finally {
      clearTimeout(timeout)
    }
  }
}
