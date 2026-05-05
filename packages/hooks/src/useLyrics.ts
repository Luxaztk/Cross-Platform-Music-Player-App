import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlayer } from './usePlayer';
import { useLibrary } from './useLibrary';
import { useLyricSync } from './useLyricSync';

import { LyricsParser } from '@music/core';
import { LYRIC_OFFSET } from './constants/index';

export const useLyrics = () => {
  const { currentSong, progress, updateCurrentSongMetadata } = usePlayer();
  const { repository, handleUpdateSong, handlePatchSong } = useLibrary();
  const { offset, adjustOffset, setOffset, resetOffset } = useLyricSync();
  
  const [rawLyrics, setRawLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse lyrics into syncable lines
  const lyricLines = useMemo(() => {
    if (!rawLyrics) return [];
    return LyricsParser.parse(rawLyrics);
  }, [rawLyrics]);

  // Find current line index based on player progress
  const currentLineIndex = useMemo(() => {
    if (lyricLines.length === 0) return -1;
    
    // Combine base global offset with user-defined local offset
    const adjustedProgress = progress - (LYRIC_OFFSET + offset);

    let index = -1;
    for (let i = 0; i < lyricLines.length; i++) {
       if (lyricLines[i].time <= adjustedProgress) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [lyricLines, progress, offset]);

  // Fetch lyrics when song changes
  useEffect(() => {
    const fetchLyrics = async () => {
      if (!currentSong) {
        setRawLyrics(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const lyrics = await repository.getLyrics(currentSong.id);
        setRawLyrics(lyrics);
      } catch (err) {
        console.error('Failed to fetch lyrics:', err);
        setError('Không thể tải lời bài hát');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLyrics();
  }, [currentSong, repository]);

  const searchLyrics = useCallback(async (query: string) => {
    try {
      return await repository.searchLyrics(query);
    } catch (err) {
      console.error('Search lyrics error:', err);
      return [];
    }
  }, [repository]);

  const saveLyrics = useCallback(async (lyrics: string, lyricId?: number) => {
    if (!currentSong) return false;
    
    // Cache old metadata for rollback
    const oldLyricId = currentSong.lyricId;
    
    try {
      // 1. Optimistic Update in Player state
      updateCurrentSongMetadata({ lyricId });
      
      // 2. DB Update in Background
      const success = await repository.saveLyrics(currentSong.id, lyrics, lyricId);
      
      if (success) {
        setRawLyrics(lyrics);
        
        // 3. Sync Library state
        handleUpdateSong({ ...currentSong, lyricId });
      } else {
        throw new Error('Database save failed');
      }
      
      return success;
    } catch (err) {
      console.error('Save lyrics error:', err);
      
      // 4. Rollback to old state
      updateCurrentSongMetadata({ lyricId: oldLyricId });
      
      return false;
    }
  }, [currentSong, repository, updateCurrentSongMetadata, handleUpdateSong]);

  const patchLyricSearchParam = useCallback(async (searchParam: string) => {
    if (!currentSong) return false;
    
    try {
      // Optimistic Update in Player state
      updateCurrentSongMetadata({ lyricSearchParam: searchParam });
      
      // DB Update in Background
      const updated = await handlePatchSong(currentSong.id, { lyricSearchParam: searchParam });
      
      return updated !== null;
    } catch (err) {
      console.error('Patch lyric search param error:', err);
      // Rollback
      updateCurrentSongMetadata({ lyricSearchParam: currentSong.lyricSearchParam });
      return false;
    }
  }, [currentSong, updateCurrentSongMetadata, handlePatchSong]);

  return {
    rawLyrics,
    lyricLines,
    currentLineIndex,
    isLoading,
    error,
    searchLyrics,
    saveLyrics,
    patchLyricSearchParam,
    currentLine: currentLineIndex >= 0 ? lyricLines[currentLineIndex] : null,
    // Sync related
    offset,
    adjustOffset,
    setOffset,
    resetOffset
  };
};
