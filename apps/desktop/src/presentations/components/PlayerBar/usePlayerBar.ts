import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePlayer, useUI } from '@music/hooks';
import { formatTime } from '@music/utils';
import { useTheme, useLanguage } from '@hooks';
import { type UsePlayerBarReturn } from './types';
import type { RepeatMode } from '@music/hooks/types';

export const usePlayerBar = (): UsePlayerBarReturn => {
  const {
    currentSong, isPlaying, play, pause, next, prev, progress, duration,
    volume, setVolume, seek, isShuffle, toggleShuffle, repeatMode, setRepeatMode,
    queue
  } = usePlayer();

  const { t } = useLanguage();
  const { appIcon } = useTheme();
  const { isLyricsOpen, toggleLyrics } = useUI();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [lastVolume, setLastVolume] = useState(1);

  const queueContainerRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // Close queue popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isQueueOpen &&
        queueContainerRef.current &&
        !queueContainerRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        setIsQueueOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQueueOpen]);

  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
    setLocalProgress(progress);
  }, [progress]);

  const handleSeekChange = useCallback((val: number) => {
    setLocalProgress(val);
  }, []);

  const handleSeekEnd = useCallback((val: number) => {
    setIsSeeking(false);
    seek(val);
  }, [seek]);

  const handleVolumeChange = useCallback((val: number) => {
    setVolume(val);
    if (val > 0) setLastVolume(val);
  }, [setVolume]);

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      setLastVolume(volume);
      setVolume(0);
    } else {
      setVolume(lastVolume || 1);
    }
  }, [volume, lastVolume, setVolume]);

  const toggleRepeat = useCallback(() => {
    const modes: RepeatMode[] = ['OFF', 'ALL', 'ONE'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  }, [repeatMode, setRepeatMode]);

  const displayProgress = isSeeking ? localProgress : progress;
  
  const progressPercent = useMemo(() => 
    duration > 0 ? (displayProgress / duration) * 100 : 0,
    [displayProgress, duration]
  );
  
  const volumePercent = useMemo(() => 
    volume * 100,
    [volume]
  );

  return {
    state: {
      currentSong,
      isPlaying,
      progress,
      duration,
      volume,
      isShuffle,
      repeatMode,
      isQueueOpen,
      isLyricsOpen,
      isSeeking,
      localProgress,
      lastVolume,
      queue
    },
    refs: {
      queueContainerRef,
      toggleBtnRef
    },
    actions: {
      play,
      pause,
      next,
      prev,
      handleSeekStart,
      handleSeekChange,
      handleSeekEnd,
      handleVolumeChange,
      toggleMute,
      toggleShuffle,
      toggleRepeat,
      toggleQueue: () => setIsQueueOpen(!isQueueOpen),
      toggleLyrics,
      setIsQueueOpen
    },
    utils: {
      displayProgress,
      progressPercent,
      volumePercent,
      formatTime,
      appIcon,
      t
    }
  };
};
