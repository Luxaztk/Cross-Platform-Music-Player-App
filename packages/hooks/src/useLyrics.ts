import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlayer } from './PlayerProvider';
import { useLibrary } from './LibraryProvider';
import { LyricsParser } from '@music/core';

export const useLyrics = () => {
  const { currentSong, progress, updateCurrentSongMetadata } = usePlayer();
  const { repository, handleUpdateSong } = useLibrary();
  
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
    
    // Thêm một khoảng trễ nhỏ (offset) để lời bài hát nhảy muộn hơn một chút
    // Giúp khớp với cảm nhận thực tế của người dùng
    const LYRIC_OFFSET = 0.2; // 200ms delay
    const adjustedProgress = progress - LYRIC_OFFSET;

    let index = -1;
    for (let i = 0; i < lyricLines.length; i++) {
       if (lyricLines[i].time <= adjustedProgress) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [lyricLines, progress]);

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

  return {
    rawLyrics,
    lyricLines,
    currentLineIndex,
    isLoading,
    error,
    searchLyrics,
    saveLyrics,
    currentLine: currentLineIndex >= 0 ? lyricLines[currentLineIndex] : null
  };
};
