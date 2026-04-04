import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Song, PlayerState } from '@music/types';
import type { IStorageAdapter } from '@music/core';
import { AudioEngine } from '@music/player';

export type RepeatMode = 'OFF' | 'ALL' | 'ONE';

export interface PlayerContextProps {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: Song[];
  history: Song[];
  
  repeatMode: RepeatMode;
  isShuffle: boolean;
  
  playNow: (song: Song) => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  playList: (songs: Song[], startIndex: number) => void;
  removeFromQueue: (index: number) => void;
  
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
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children, storage, allSongs = [] }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<Song[]>([]);
  
  const [history, setHistory] = useState<Song[]>([]);
  const [originalContext, setOriginalContext] = useState<Song[]>([]);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('OFF');
  const [isShuffle, setIsShuffle] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const engineRef = useRef<AudioEngine | null>(null);

  // We need refs to latest state for the AudioEngine callbacks
  const queueRef = useRef(queue); queueRef.current = queue;
  const historyRef = useRef(history); historyRef.current = history;
  const originalContextRef = useRef(originalContext); originalContextRef.current = originalContext;
  const currentSongRef = useRef(currentSong); currentSongRef.current = currentSong;
  const repeatModeRef = useRef(repeatMode); repeatModeRef.current = repeatMode;
  const isShuffleRef = useRef(isShuffle); isShuffleRef.current = isShuffle;

  // Hydration effect - load from storage on mount
  useEffect(() => {
    const hydrate = async () => {
      if (!storage || allSongs.length === 0) {
        setIsHydrated(true); // Nothing to hydrate or songs not ready yet
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
              // Load but don't autoplay as per user request
              engineRef.current?.load(song.filePath, false);
            }
          }

          setQueue(savedState.queueIds.map(findSong).filter((s): s is Song => s !== null));
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

    // Delay hydration until allSongs is populated
    if (allSongs.length > 0 && !isHydrated) {
      hydrate();
    }
  }, [storage, allSongs.length, isHydrated]);

  // Persistence effect - save to storage on changes
  useEffect(() => {
    const persist = async () => {
      if (!storage || !isHydrated) return;

      const state: PlayerState = {
        currentSongId: currentSong?.id || null,
        queueIds: queue.map(s => s.id),
        historyIds: history.map(s => s.id),
        originalContextIds: originalContext.map(s => s.id),
        volume,
        repeatMode,
        isShuffle
      };

      try {
        await storage.savePlayerState(state);
      } catch (error) {
        console.error('Failed to save player state:', error);
      }
    };

    persist();
  }, [storage, isHydrated, currentSong, queue, history, originalContext, volume, repeatMode, isShuffle]);

  const pushToHistory = (song: Song) => {
    setHistory(prev => {
      // most recently played item at index 0
      const newHistory = [song, ...prev];
      if (newHistory.length > 32) { // Increased history size slightly
         newHistory.pop(); // Remove oldest (the end of array)
      }
      return newHistory;
    });
  };

  const handleNext = () => {
    if (currentSongRef.current) {
        pushToHistory(currentSongRef.current);
    }

    if (queueRef.current.length > 0) {
      const nextSong = queueRef.current[0];
      setQueue(prev => prev.slice(1));
      playSong(nextSong);
    } else {
      // queue empty
      if (repeatModeRef.current === 'ALL' && originalContextRef.current.length > 0) {
        // Restart the context
        let newQueue = [...originalContextRef.current];
        if (isShuffleRef.current) {
           newQueue = shuffleArray(newQueue);
        }
        const nextSong = newQueue[0];
        setQueue(newQueue.slice(1));
        playSong(nextSong);
      } else {
        // End of queue
        engineRef.current?.stop();
      }
    }
  };

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
      }
    });
    
    engine.setVolume(1);
    engineRef.current = engine;
    
    return () => {
      engine.stop();
    };
  }, []);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setProgress(0);
    if (engineRef.current) {
      engineRef.current.load(song.filePath, true); // true = autoplay
    }
  };

  const playList = (songs: Song[], startIndex: number) => {
    setOriginalContext(songs);
    // DO NOT clear history, just append the current one if any
    if (currentSongRef.current) pushToHistory(currentSongRef.current);
    
    const startSong = songs[startIndex];
    let upcomingQueue = songs.slice(startIndex + 1);
    if (isShuffleRef.current) {
       upcomingQueue = shuffleArray(upcomingQueue);
    }
    setQueue(upcomingQueue);
    playSong(startSong);
  };

  const playNow = (song: Song) => {
    if (currentSongRef.current) pushToHistory(currentSongRef.current);
    playSong(song);
  };

  const playNext = (song: Song) => {
    setQueue(prev => [song, ...prev]);
  };

  const addToQueue = (song: Song) => {
    setQueue(prev => [...prev, song]);
  };

  const removeFromQueue = (index: number) => {
     setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const toggleShuffle = () => {
    const nextVal = !isShuffle;
    setIsShuffle(nextVal);
    
    if (nextVal) {
       // Turned ON: Shuffle the current queue
       setQueue(prev => shuffleArray([...prev]));
    } else {
       // Turned OFF: Restore the original context straight from the current playing sequence
       const currentId = currentSongRef.current?.id;
       if (currentId && originalContextRef.current.length > 0) {
          const idx = originalContextRef.current.findIndex(s => s.id === currentId);
          if (idx !== -1) {
             setQueue(originalContextRef.current.slice(idx + 1));
          }
       }
    }
  };

  const play = () => {
    if (currentSong && engineRef.current) {
      engineRef.current.play();
    }
  };

  const pause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
  };

  const next = () => {
    handleNext();
  };

  const prev = () => {
    if (progress > 3) {
      engineRef.current?.seek(0);
    } else {
      if (historyRef.current.length > 0) {
         const newHistory = [...historyRef.current];
         const prevSong = newHistory.shift()!; // Get the most recent history item
         setHistory(newHistory);
         
         if (currentSongRef.current) {
            setQueue(q => [currentSongRef.current!, ...q]); // pushing current song to queue
         }
         playSong(prevSong);
      } else {
         engineRef.current?.seek(0);
         if (!isPlaying) engineRef.current?.play();
      }
    }
  };

  const seek = (time: number) => {
    if (engineRef.current) {
      engineRef.current.seek(time);
      setProgress(time);
    }
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    if (engineRef.current) {
      engineRef.current.setVolume(vol);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
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
        play,
        pause,
        next,
        prev,
        seek,
        setVolume,
        setRepeatMode,
        toggleShuffle
      }}
    >
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
