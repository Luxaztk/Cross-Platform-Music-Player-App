import { useCallback, useEffect, useState } from 'react'
import { formatLyricsSearchQuery } from '@music/core'
import { useLyrics, usePlayer } from '@music/hooks'
import type { LyricSearchResult } from '@music/types'

export function useMobileLyrics() {
  const { currentSong, seek } = usePlayer()
  const {
    rawLyrics,
    lyricLines,
    currentLineIndex,
    isLoading,
    error,
    searchLyrics,
    saveLyrics,
    patchLyricSearchParam,
  } = useLyrics()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LyricSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setQuery(
      currentSong?.lyricSearchParam ||
        (currentSong ? formatLyricsSearchQuery(currentSong.title, currentSong.artist) : ''),
    )
    setResults([])
  }, [currentSong?.id, currentSong?.lyricSearchParam, currentSong?.title, currentSong?.artist])

  const search = useCallback(async () => {
    if (!currentSong) return
    const requestedQuery = query.trim() || formatLyricsSearchQuery(currentSong.title, currentSong.artist)
    setIsSearching(true)
    try {
      let nextResults = await searchLyrics(requestedQuery)
      if (nextResults.length === 0 && requestedQuery.includes(' - ')) {
        nextResults = await searchLyrics(currentSong.title)
      }
      setResults(nextResults)
    } finally {
      setIsSearching(false)
    }
  }, [currentSong, query, searchLyrics])

  const selectResult = useCallback(async (result: LyricSearchResult) => {
    const lyrics = result.syncedLyrics || result.plainLyrics
    if (!lyrics) return false
    setIsSaving(true)
    try {
      const saved = await saveLyrics(lyrics, result.id)
      if (saved) {
        await patchLyricSearchParam(query.trim())
        setResults([])
      }
      return saved
    } finally {
      setIsSaving(false)
    }
  }, [patchLyricSearchParam, query, saveLyrics])

  return {
    currentSong,
    rawLyrics,
    lyricLines,
    currentLineIndex,
    isLoading,
    error,
    query,
    results,
    isSearching,
    isSaving,
    setQuery,
    search,
    selectResult,
    seek,
  }
}
