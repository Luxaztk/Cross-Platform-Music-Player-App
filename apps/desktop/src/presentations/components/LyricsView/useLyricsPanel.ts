import { useState, useRef, useEffect, useCallback } from 'react';
import { useLyrics, usePlayer } from '@music/hooks';

import { useLanguage } from '@hooks';
import { formatLyricsSearchQuery } from '@music/core';
import type { LyricSearchResult } from '@music/types';
import { type UseLyricsPanelReturn } from './types';

export const useLyricsPanel = (): UseLyricsPanelReturn => {
  const { t } = useLanguage();
  const { currentSong, seek, progress } = usePlayer();
  const {
    lyricLines,
    currentLineIndex,
    isLoading,
    searchLyrics,
    saveLyrics,
    patchLyricSearchParam,
    offset,
    adjustOffset,
    setOffset,
    resetOffset
  } = useLyrics();

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LyricSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => 
    currentSong?.lyricSearchParam || (currentSong ? formatLyricsSearchQuery(currentSong.title, currentSong.artist) : '')
  );
  const [lastQueryUsed, setLastQueryUsed] = useState('');
  const [showHint, setShowHint] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Auto scroll to active line
  useEffect(() => {
    if (activeLineRef.current && scrollRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIndex]);

  const [prevSongId, setPrevSongId] = useState<string | undefined>(undefined);
  const [prevSearchParam, setPrevSearchParam] = useState<string | undefined>(undefined);

  if (currentSong?.id !== prevSongId || currentSong?.lyricSearchParam !== prevSearchParam) {
    setPrevSongId(currentSong?.id);
    setPrevSearchParam(currentSong?.lyricSearchParam);
    setSearchResults([]);
    setIsSearching(false);
    
    const newQuery = currentSong?.lyricSearchParam || (currentSong ? formatLyricsSearchQuery(currentSong.title, currentSong.artist) : '');
    setSearchQuery(newQuery);
  }

  // Ephemeral Hint: Briefly show hidden buttons when panel opens
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleLineClick = useCallback((time: number) => {
    seek(time);
  }, [seek]);

  const handleSearch = useCallback(async () => {
    if (!currentSong) return;
    setIsSearching(true);

    let query = searchQuery.trim();
    if (!query) {
      query = currentSong.lyricSearchParam || formatLyricsSearchQuery(currentSong.title, currentSong.artist);
    }

    try {
      let results = await searchLyrics(query);
      setLastQueryUsed(query);

      if (results.length === 0 && query.includes(' - ')) {
        const fallbackQuery = currentSong.title;
        results = await searchLyrics(fallbackQuery);
        setLastQueryUsed(fallbackQuery);
      }

      setSearchResults(results);
    } catch (err) {
      console.error('[LyricsView] handleSearch failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [currentSong, searchQuery, searchLyrics]);

  const selectSearchResult = useCallback(async (lyrics: string, lyricId: number) => {
    const success = await saveLyrics(lyrics, lyricId);
    if (success) {
      if (lastQueryUsed) {
        await patchLyricSearchParam(lastQueryUsed);
      }
      setSearchResults([]);
      setSearchQuery('');
      setLastQueryUsed('');
    }
  }, [saveLyrics, patchLyricSearchParam, lastQueryUsed]);

  return {
    state: {
      lyricLines,
      currentLineIndex,
      isLoading,
      isSearching,
      searchResults,
      searchQuery,
      offset,
      showHint,
      currentSong,
      progress
    },
    refs: {
      scrollRef,
      activeLineRef
    },
    actions: {
      handleSearch,
      selectSearchResult,
      handleLineClick,
      adjustOffset,
      setOffset,
      resetOffset,
      setSearchQuery,
      setSearchResults
    },
    utils: {
      t
    }
  };
};
