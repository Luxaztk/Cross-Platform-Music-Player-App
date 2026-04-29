import { useState, useEffect, useCallback } from 'react';
import { usePlayer } from './usePlayer';

const STORAGE_KEY_PREFIX = 'lyric_offset_';

export const useLyricSync = () => {
  const { currentSong } = usePlayer();
  const [offset, setOffsetState] = useState(0);

  // Load offset from localStorage when song changes
  useEffect(() => {
    if (currentSong?.originId) {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + currentSong.originId);
      setOffsetState(saved ? parseFloat(saved) : 0);
    } else {
      setOffsetState(0);
    }
  }, [currentSong?.originId]);

  const setOffset = useCallback((value: number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    const finalValue = isNaN(numericValue) ? 0 : numericValue;
    
    setOffsetState(finalValue);
    if (currentSong?.originId) {
      localStorage.setItem(STORAGE_KEY_PREFIX + currentSong.originId, finalValue.toString());
    }
  }, [currentSong?.originId]);

  const adjustOffset = useCallback((amount: number) => {
    setOffsetState((prev) => {
      const newVal = Math.round((prev + amount) * 10) / 10; // Avoid floating point precision issues
      if (currentSong?.originId) {
        localStorage.setItem(STORAGE_KEY_PREFIX + currentSong.originId, newVal.toString());
      }
      return newVal;
    });
  }, [currentSong?.originId]);

  const resetOffset = useCallback(() => {
    setOffset(0);
  }, [setOffset]);

  return {
    offset,
    setOffset,
    adjustOffset,
    resetOffset
  };
};
