import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Song, PlayerState } from '@music/types';
import type { IStorageAdapter } from '@music/core';
import { AudioEngine } from '@music/player';
import { useAudioDevices } from './useAudioDevices';

export type RepeatMode = 'OFF' | 'ALL' | 'ONE';

export interface QueueItem {
  uid: string;
  song: Song;
}

export interface PlayerContextProps {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: QueueItem[];
  history: Song[];

  repeatMode: RepeatMode;
  isShuffle: boolean;

  playNow: (song: Song) => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  playList: (songs: Song[], startIndex: number) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;

  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
}

export const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

// Helper for shuffling array (Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

interface PlayerProviderProps {
  children: React.ReactNode;
  storage?: IStorageAdapter;
  allSongs?: Song[];
  onFileError?: (song: Song) => void;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children, storage, allSongs = [], onFileError }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const generateUid = useCallback(() => Math.random().toString(36).substring(2, 11) + Date.now().toString(36), []);

  const [history, setHistory] = useState<Song[]>([]);
  const [originalContext, setOriginalContext] = useState<Song[]>([]);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('OFF');
  const [isShuffle, setIsShuffle] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { currentDeviceId } = useAudioDevices();

  const engineRef = useRef<AudioEngine | null>(null);

  // We need refs to latest state for the AudioEngine callbacks
  const queueRef = useRef(queue); queueRef.current = queue;
  const historyRef = useRef(history); historyRef.current = history;
  const originalContextRef = useRef(originalContext); originalContextRef.current = originalContext;
  const currentSongRef = useRef(currentSong); currentSongRef.current = currentSong;
  const repeatModeRef = useRef(repeatMode); repeatModeRef.current = repeatMode;
  const isShuffleRef = useRef(isShuffle); isShuffleRef.current = isShuffle;
  const onFileErrorRef = useRef(onFileError); onFileErrorRef.current = onFileError;

  const pushToHistory = useCallback((song: Song) => {
    setHistory(prev => {
      const newHistory = [song, ...prev];
      if (newHistory.length > 32) {
        newHistory.pop();
      }
      return newHistory;
    });
  }, []);

  const playSong = useCallback((song: Song) => {
    setCurrentSong(song);
    setProgress(0);
    if (engineRef.current) {
      engineRef.current.load(song.filePath, true);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentSongRef.current) {
      pushToHistory(currentSongRef.current);
    }

    if (queueRef.current.length > 0) {
      const nextItem = queueRef.current[0];
      setQueue(prev => prev.slice(1));
      playSong(nextItem.song);
    } else {
      if (repeatModeRef.current === 'ALL' && originalContextRef.current.length > 0) {
        let newSongs = [...originalContextRef.current];
        if (isShuffleRef.current) {
          newSongs = shuffleArray(newSongs);
        }
        const nextSong = newSongs[0];
        setQueue(newSongs.slice(1).map(song => ({ uid: generateUid(), song })));
        playSong(nextSong);
      } else {
        engineRef.current?.stop();
      }
    }
  }, [playSong, pushToHistory, generateUid]);

  const handlePrev = useCallback(() => {
    // We use the progress state which is synchronized with the engine
    if (progress > 3) {
      engineRef.current?.seek(0);
    } else {
      if (historyRef.current.length > 0) {
        const newHistory = [...historyRef.current];
        const prevSong = newHistory.shift()!;
        setHistory(newHistory);

        if (currentSongRef.current) {
          setQueue(q => [{ uid: generateUid(), song: currentSongRef.current! }, ...q]);
        }
        playSong(prevSong);
      } else {
        engineRef.current?.seek(0);
        if (!engineRef.current?.isPlaying()) engineRef.current?.play();
      }
    }
  }, [playSong, generateUid, progress]);

  // Engine initialization effect
  useEffect(() => {
    const engine = new AudioEngine({
      onProgress: (p, d) => {
        setProgress(p);
        setDuration(isFinite(d) && d > 0 ? d : (currentSongRef.current?.duration || 0));
      },
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onStop: () => {
        setIsPlaying(false);
        setProgress(0);
      },
      onEnd: () => {
        setIsPlaying(false);
        setProgress(0);
        if (repeatModeRef.current === 'ONE') {
          engineRef.current?.seek(0);
          engineRef.current?.play();
        } else {
          handleNext();
        }
      },
      onLoad: (d) => {
        setDuration(isFinite(d) && d > 0 ? d : (currentSongRef.current?.duration || 0));
      },
      onLoadError: (_err) => {
        // File not found on disk — notify the consumer and auto-skip
        const failedSong = currentSongRef.current;
        if (failedSong && onFileErrorRef.current) {
          onFileErrorRef.current(failedSong);
        }
        // Give the UI a tiny moment to show the toast, then skip
        setTimeout(() => handleNext(), 800);
      },
      onPlayError: (_err) => {
        // Play errors (e.g. autoplay blocked) — same auto-skip logic
        const failedSong = currentSongRef.current;
        if (failedSong && onFileErrorRef.current) {
          onFileErrorRef.current(failedSong);
        }
        setTimeout(() => handleNext(), 800);
      },
    });

    engine.setVolume(1);
    engineRef.current = engine;

    return () => {
      engine.stop();
    };
  }, [handleNext]);

  useEffect(() => {
    if (engineRef.current && currentDeviceId) {
      engineRef.current.setSinkId(currentDeviceId);
    }
  }, [currentDeviceId]);

  // Hydration effect
  useEffect(() => {
    const hydrate = async () => {
      if (!storage || allSongs.length === 0 || !engineRef.current) {
        if (!(allSongs.length > 0 && storage)) {
          setIsHydrated(true);
        }
        return;
      }

      try {
        const savedState = await storage.getPlayerState();
        if (savedState) {
          const findSong = (id: string | null) => allSongs.find(s => s.id === id) || null;

          if (savedState.currentSongId) {
            const song = findSong(savedState.currentSongId);
            if (song) {
              setCurrentSong(song);
              setDuration(song.duration || 0);
            }
          }

          setQueue(savedState.queueIds.map(findSong).filter((s): s is Song => s !== null).map(song => ({ uid: generateUid(), song })));
          setHistory(savedState.historyIds.map(findSong).filter((s): s is Song => s !== null));
          setOriginalContext(savedState.originalContextIds.map(findSong).filter((s): s is Song => s !== null));
          setVolumeState(savedState.volume);
          setRepeatMode(savedState.repeatMode);
          setIsShuffle(savedState.isShuffle);

          if (engineRef.current) {
            engineRef.current.setVolume(savedState.volume);
          }
        }
      } catch (error) {
        console.error('Failed to hydrate player state:', error);
      } finally {
        setIsHydrated(true);
      }
    };

    if (allSongs.length > 0 && !isHydrated) {
      hydrate();
    }
  }, [storage, allSongs, isHydrated, generateUid]);

  // Persistence effect
  useEffect(() => {
    if (!storage || !isHydrated) return;

    const state: PlayerState = {
      currentSongId: currentSong?.id || null,
      queueIds: queue.map(item => item.song.id),
      historyIds: history.map(s => s.id),
      originalContextIds: originalContext.map(s => s.id),
      volume,
      repeatMode,
      isShuffle
    };

    storage.savePlayerState(state).catch(err => console.error('Failed to save player state:', err));
  }, [storage, isHydrated, currentSong, queue, history, originalContext, volume, repeatMode, isShuffle]);

  const playList = useCallback((songs: Song[], startIndex: number) => {
    setOriginalContext(songs);
    if (currentSongRef.current) pushToHistory(currentSongRef.current);

    const startSong = songs[startIndex];
    let upcomingSongs = songs.slice(startIndex + 1);
    if (isShuffleRef.current) {
      upcomingSongs = shuffleArray(upcomingSongs);
    }
    setQueue(upcomingSongs.map(song => ({ uid: generateUid(), song })));
    playSong(startSong);
  }, [playSong, pushToHistory, generateUid]);

  const playNow = useCallback((song: Song) => {
    if (currentSongRef.current) pushToHistory(currentSongRef.current);
    playSong(song);
  }, [playSong, pushToHistory]);

  const playNext = useCallback((song: Song) => {
    setQueue(prev => [{ uid: generateUid(), song }, ...prev]);
  }, [generateUid]);

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => [...prev, { uid: generateUid(), song }]);
  }, [generateUid]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    const nextVal = !isShuffleRef.current;
    setIsShuffle(nextVal);

    if (nextVal) {
      setQueue(prev => shuffleArray([...prev]));
    } else {
      const currentId = currentSongRef.current?.id;
      if (currentId && originalContextRef.current.length > 0) {
        const idx = originalContextRef.current.findIndex(s => s.id === currentId);
        if (idx !== -1) {
          const remainingSongs = originalContextRef.current.slice(idx + 1);
          setQueue(remainingSongs.map(song => ({ uid: generateUid(), song })));
        }
      }
    }
  }, [generateUid]);

  const play = useCallback(() => {
    if (currentSongRef.current && engineRef.current) {
      const engineState = engineRef.current.state();
      const currentSrc = engineRef.current.getSource();
      const expectedUrl = `melovista://app/${encodeURIComponent(currentSongRef.current.filePath)}`;
      
      if (engineState !== 'loaded' || currentSrc !== expectedUrl) {
        engineRef.current.load(currentSongRef.current.filePath, true);
      } else {
        engineRef.current.play();
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
  }, []);

  const next = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const prev = useCallback(() => {
    handlePrev();
  }, [handlePrev]);

  const seek = useCallback((time: number) => {
    if (currentSongRef.current && engineRef.current) {
      const engineState = engineRef.current.state();
      const currentSrc = engineRef.current.getSource();
      const expectedUrl = `melovista://app/${encodeURIComponent(currentSongRef.current.filePath)}`;
      
      if (engineState !== 'loaded' || currentSrc !== expectedUrl) {
        engineRef.current.load(currentSongRef.current.filePath, false);
      }
      
      engineRef.current.seek(time);
      setProgress(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (engineRef.current) {
      engineRef.current.setVolume(vol);
    }
  }, []);

  const contextValue = useMemo(() => ({
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    queue,
    history,
    repeatMode,
    isShuffle,
    playNow,
    playNext,
    addToQueue,
    playList,
    removeFromQueue,
    reorderQueue,
    play,
    pause,
    next,
    prev,
    seek,
    setVolume,
    setRepeatMode,
    toggleShuffle
  }), [
    currentSong, isPlaying, progress, duration, volume, queue, history,
    repeatMode, isShuffle, playNow, playNext, addToQueue, playList,
    removeFromQueue, reorderQueue, play, pause, next, prev, seek,
    setVolume, toggleShuffle
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
