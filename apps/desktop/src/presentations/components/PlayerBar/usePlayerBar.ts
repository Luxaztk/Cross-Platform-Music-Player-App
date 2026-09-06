import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePlayer, useUI } from '@music/hooks';
import { formatTime } from '@music/utils';
import { useTheme, useLanguage } from '@hooks';
import { type UsePlayerBarReturn } from './types';
import type { RepeatMode } from '@music/hooks/types';
import type { SongChapter } from '@music/types';

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
  const [isChapterEditorOpen, setIsChapterEditorOpen] = useState(false);
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

  const currentChapter = useMemo(() => {
    if (!currentSong?.chapters || currentSong.chapters.length === 0) return null;
    const pos = displayProgress;
    for (let i = currentSong.chapters.length - 1; i >= 0; i--) {
      if (pos >= currentSong.chapters[i].startTime) {
        return currentSong.chapters[i];
      }
    }
    return currentSong.chapters[0];
  }, [currentSong, displayProgress]);

  const seekToChapter = useCallback((chapter: SongChapter) => {
    seek(chapter.startTime);
  }, [seek]);

  const nextChapter = useCallback(() => {
    if (!currentSong?.chapters || currentSong.chapters.length === 0) {
      next();
      return;
    }
    const idx = currentSong.chapters.findIndex(c => c.id === currentChapter?.id);
    const remaining = currentSong.chapters.slice(idx + 1);
    const nextActive = remaining.find(c => !c.skip);
    if (nextActive) {
      seek(nextActive.startTime);
    } else {
      next();
    }
  }, [currentSong, currentChapter, seek, next]);

  const prevChapter = useCallback(() => {
    if (!currentSong?.chapters || currentSong.chapters.length === 0) {
      prev();
      return;
    }
    const idx = currentSong.chapters.findIndex(c => c.id === currentChapter?.id);
    if (idx !== -1) {
      const ch = currentSong.chapters[idx];
      if (displayProgress > ch.startTime + 3 && !ch.skip) {
        seek(ch.startTime);
      } else {
        const preceding = currentSong.chapters.slice(0, idx).reverse();
        const prevActive = preceding.find(c => !c.skip);
        if (prevActive) {
          seek(prevActive.startTime);
        } else {
          seek(0);
        }
      }
    } else {
      prev();
    }
  }, [currentSong, currentChapter, displayProgress, seek, prev]);

  return {
    state: {
      currentSong,
      currentChapter,
      isPlaying,
      progress,
      duration,
      volume,
      isShuffle,
      repeatMode,
      isQueueOpen,
      isLyricsOpen,
      isChapterEditorOpen,
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
      seekToChapter,
      nextChapter,
      prevChapter,
      handleSeekStart,
      handleSeekChange,
      handleSeekEnd,
      handleVolumeChange,
      toggleMute,
      toggleShuffle,
      toggleRepeat,
      toggleQueue: () => setIsQueueOpen(!isQueueOpen),
      toggleLyrics,
      setIsQueueOpen,
      setIsChapterEditorOpen,
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
