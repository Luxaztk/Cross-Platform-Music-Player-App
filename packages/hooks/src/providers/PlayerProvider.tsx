import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Song, PlayerState } from '@music/types';
import { shuffleArray } from '@music/utils';
import type { IAudioEngine } from '@music/core';
import { AudioEngine } from '@music/player';

import { useAudioDevices } from '../useAudioDevices';
import { useMediaSession } from '../useMediaSession';
import { PlayerContext } from '../PlayerContext';


import type { 
  PlayerUiState,
  RepeatMode, 
  QueueItem, 
  PlayerProviderProps 
} from '../types/index';






export const PlayerProvider: React.FC<PlayerProviderProps> = ({ 
  children, 
  storage, 
  engine: externalEngine,
  allSongs = [] as Song[], 
  onFileError,
  onSavePlaybackPosition
}) => {


  const [uiState, setUiState] = useState<PlayerUiState>({ currentSong: null, isPlaying: false, progress: 0, duration: 0 });
  const { currentSong } = uiState;
  
  const progressRef = useRef(0);
  const setProgress = useCallback((val: number) => {
    progressRef.current = val;
    setUiState((prev: PlayerUiState) => ({ ...prev, progress: val }));
  }, []);
  
  const [volume, setVolumeState] = useState(1);
  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (engineRef.current) {
      engineRef.current.setVolume(vol);
    }
  }, []);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const generateUid = useCallback(() => Math.random().toString(36).substring(2, 11) + Date.now().toString(36), []);

  const [history, setHistory] = useState<Song[]>([]);
  const [originalContext, setOriginalContext] = useState<Song[]>([]);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('OFF');
  const [isShuffle, setIsShuffle] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { currentDeviceId } = useAudioDevices();

  const engineRef = useRef<IAudioEngine | null>(null);

  // We need refs to latest state for the AudioEngine callbacks
  const queueRef = useRef(queue);
  const historyRef = useRef(history);
  const originalContextRef = useRef(originalContext);
  const currentSongRef = useRef(currentSong);
  const repeatModeRef = useRef(repeatMode);
  const isShuffleRef = useRef(isShuffle);
  const onFileErrorRef = useRef(onFileError);
  const onSavePlaybackPositionRef = useRef(onSavePlaybackPosition);
  const volumeRef = useRef(volume);

  const lastSavedTimeRef = useRef(0);

  const savePlaybackPosition = useCallback((force = false) => {
    const song = currentSongRef.current;
    if (!song || !onSavePlaybackPositionRef.current) return;
    if ((song.duration || 0) <= 600) return; // Only save for songs > 10 mins

    const pos = progressRef.current;
    if (!force) {
      const now = Date.now();
      // Throttle: max 1 save per 15 seconds
      if (now - lastSavedTimeRef.current < 15000) return;
      lastSavedTimeRef.current = Date.now();
      onSavePlaybackPositionRef.current(song.id, pos);
    } else {
      // Defer the save when changing tracks to prevent synchronous IO (like electron-store)
      // from blocking the main thread while the new track's audio is trying to load.
      lastSavedTimeRef.current = Date.now();
      setTimeout(() => {
        onSavePlaybackPositionRef.current?.(song.id, pos);
      }, 500);
    }
  }, []);

  React.useLayoutEffect(() => {
    queueRef.current = queue;
    historyRef.current = history;
    originalContextRef.current = originalContext;
    currentSongRef.current = currentSong;
    repeatModeRef.current = repeatMode;
    isShuffleRef.current = isShuffle;
    onFileErrorRef.current = onFileError;
    onSavePlaybackPositionRef.current = onSavePlaybackPosition;
    volumeRef.current = volume;
  });

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
    if (!song) return;
    savePlaybackPosition(true);

    progressRef.current = 0;
    setUiState((prev: PlayerUiState) => ({ ...prev, currentSong: song, progress: 0 }));
    lastSavedTimeRef.current = 0;
    
    if (engineRef.current) {
      engineRef.current.load(song.filePath, true);
      
      // Auto resume logic
      if ((song.duration || 0) > 600 && song.lastPlaybackPosition) {
        if (song.lastPlaybackPosition > 10 && song.lastPlaybackPosition < (song.duration || 0) - 10) {
          engineRef.current.seek(song.lastPlaybackPosition);
          setProgress(song.lastPlaybackPosition);
        }
      }
    }
  }, [setProgress, savePlaybackPosition]);

  // ==========================================
  // ITERATOR PATTERN (Playback Iterator)
  // ==========================================
  const playbackIterator = useMemo(() => ({
    hasNext: () => queueRef.current.length > 0 || (repeatModeRef.current === 'ALL' && originalContextRef.current.length > 0),
    hasPrev: () => historyRef.current.length > 0,
    
    next: () => {
      if (currentSongRef.current) {
        pushToHistory(currentSongRef.current);
      }

      if (repeatModeRef.current === 'ONE') {
        return engineRef.current?.seek(0);
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
            // Prevent playing the same song twice in a row when repeating
            if (newSongs.length > 1 && currentSongRef.current && newSongs[0].id === currentSongRef.current.id) {
              const temp = newSongs[0];
              newSongs[0] = newSongs[newSongs.length - 1];
              newSongs[newSongs.length - 1] = temp;
            }
          }
          const nextSong = newSongs[0];
          setQueue(newSongs.slice(1).map(song => ({ uid: generateUid(), song })));
          playSong(nextSong);
        } else {
          engineRef.current?.stop();
        }
      }
    },

    prev: () => {
      if (progressRef.current > 3) {
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
    }
  }), [playSong, pushToHistory, generateUid]);
  // ==========================================

  // Engine initialization effect
  useEffect(() => {
    const engine = externalEngine || new AudioEngine();
    // eslint-disable-next-line
    engineRef.current = engine;
    engine.setEvents({
      onProgress: (p, d) => {
        progressRef.current = p;
        setUiState((prev: PlayerUiState) => {
          const newDuration = isFinite(d) && d > 0 ? d : (currentSongRef.current?.duration || prev.duration);
          if (prev.progress === p && prev.duration === newDuration) return prev;
          return { ...prev, progress: p, duration: newDuration };
        });
        savePlaybackPosition(false);
      },
      onPlay: () => setUiState((prev: PlayerUiState) => ({ ...prev, isPlaying: true })),
      onPause: () => {
        setUiState((prev: PlayerUiState) => ({ ...prev, isPlaying: false }));
        savePlaybackPosition(true);
      },
      onStop: () => {
        progressRef.current = 0;
        setUiState((prev: PlayerUiState) => ({ ...prev, isPlaying: false, progress: 0 }));
        savePlaybackPosition(true);
      },
      onEnd: () => {
        progressRef.current = 0;
        setUiState((prev: PlayerUiState) => ({ ...prev, isPlaying: false, progress: 0 }));
        if (currentSongRef.current && (currentSongRef.current.duration || 0) > 600 && onSavePlaybackPositionRef.current) {
          const idToSave = currentSongRef.current.id;
          setTimeout(() => {
            onSavePlaybackPositionRef.current?.(idToSave, 0);
          }, 500);
        }
        if (repeatModeRef.current === 'ONE') {
          engineRef.current?.seek(0);
          engineRef.current?.play();
        } else {
          playbackIterator.next();
        }
      },
      onLoad: (d) => {
        setUiState((prev: PlayerUiState) => {
          const newDuration = isFinite(d) && d > 0 ? d : (currentSongRef.current?.duration || prev.duration);
          if (prev.duration === newDuration) return prev;
          return { ...prev, duration: newDuration };
        });
      },
      onLoadError: () => {
        // File not found on disk — notify the consumer and auto-skip
        const failedSong = currentSongRef.current;
        if (failedSong && onFileErrorRef.current) {
          onFileErrorRef.current(failedSong);
        }
        // Give the UI a tiny moment to show the toast, then skip
        setTimeout(() => playbackIterator.next(), 800);
      },
      onPlayError: () => {
        // Play errors (e.g. autoplay blocked) — same auto-skip logic
        const failedSong = currentSongRef.current;
        if (failedSong && onFileErrorRef.current) {
          onFileErrorRef.current(failedSong);
        }
        setTimeout(() => playbackIterator.next(), 800);
      },
    });

    engine.setVolume(volumeRef.current);

    return () => {
      engine.stop();
    };
  }, [playbackIterator, setProgress, externalEngine, savePlaybackPosition]);

  useEffect(() => {
    if (engineRef.current && engineRef.current.setSinkId && currentDeviceId) {
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
          const findSong = (id: string | null): Song | null => allSongs.find((s: Song) => s.id === id) || null;

          if (savedState.currentSongId) {
            const song = findSong(savedState.currentSongId);
            if (song) {
              setUiState((prev: PlayerUiState) => ({ ...prev, currentSong: song, duration: song.duration || 0 }));
            }
          }

          setQueue(savedState.queueIds.map(findSong).filter((s): s is Song => s !== null).map((song: Song) => ({ uid: generateUid(), song })));
          setHistory(savedState.historyIds.map(findSong).filter((s): s is Song => s !== null));
          setOriginalContext(savedState.originalContextIds.map(findSong).filter((s): s is Song => s !== null));

          setVolume(savedState.volume);
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
  }, [storage, allSongs, isHydrated, generateUid, setVolume, setRepeatMode, setIsShuffle]);

  // Persistence effect
  useEffect(() => {
    if (!storage || !isHydrated) return;

    const state: PlayerState = {
      currentSongId: uiState.currentSong?.id || null,
      queueIds: queue.map(item => item.song.id),
      historyIds: history.map(s => s.id),
      originalContextIds: originalContext.map(s => s.id),
      volume,
      repeatMode,
      isShuffle
    };

    storage.savePlayerState(state).catch(err => console.error('Failed to save player state:', err));
  }, [storage, isHydrated, uiState.currentSong, queue, history, originalContext, volume, repeatMode, isShuffle]);

  const updateCurrentSongMetadata = useCallback((partial: Partial<Song>) => {
    setUiState((prev: PlayerUiState) => prev.currentSong ? ({ ...prev, currentSong: { ...prev.currentSong, ...partial } }) : prev);

    // Also update in queue
    setQueue(prevQueue => prevQueue.map(item => {
      if (currentSongRef.current && item.song.id === currentSongRef.current.id) {
        return { ...item, song: { ...item.song, ...partial } };
      }
      return item;
    }));

    // Update in history
    setHistory(prevHistory => prevHistory.map(song => {
      if (currentSongRef.current && song.id === currentSongRef.current.id) {
        return { ...song, ...partial };
      }
      return song;
    }));
  }, []);

  const playList = useCallback((songs: Song[], startIndex: number) => {
    if (!songs || songs.length === 0) return;
    const safeIndex = (startIndex >= 0 && startIndex < songs.length) ? startIndex : 0;

    setOriginalContext(songs);
    
    // Prepare history: preserve current song, then prepend preceding playlist songs
    let newHistory: Song[] = [];
    if (!isShuffleRef.current && safeIndex > 0) {
      // Reverse preceding songs so the immediately preceding song is at index 0
      newHistory = songs.slice(0, safeIndex).reverse();
    }
    if (currentSongRef.current) {
      newHistory.push(currentSongRef.current);
    }
    // Only keep up to 50 history items
    setHistory(newHistory.slice(0, 50));

    const startSong = songs[safeIndex];
    let upcomingSongs: Song[];
    if (isShuffleRef.current) {
      const allOtherSongs = [...songs.slice(0, safeIndex), ...songs.slice(safeIndex + 1)];
      upcomingSongs = shuffleArray(allOtherSongs);
    } else {
      upcomingSongs = songs.slice(startIndex + 1);
    }
    setQueue(upcomingSongs.map(song => ({ uid: generateUid(), song })));
    playSong(startSong);
  }, [playSong, generateUid]);

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

  const addSongsToQueue = useCallback((songs: Song[]) => {
    setQueue(prev => [
      ...prev,
      ...songs.map(song => ({ uid: generateUid(), song }))
    ]);
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
    playbackIterator.next();
  }, [playbackIterator]);

  const prev = useCallback(() => {
    playbackIterator.prev();
  }, [playbackIterator]);

  const seek = useCallback((time: number) => {
    if (currentSongRef.current && engineRef.current) {
      const engineState = engineRef.current.state();
      const currentSrc = engineRef.current.getSource();
      const expectedUrl = `melovista://app/${encodeURIComponent(currentSongRef.current.filePath)}`;
      
      if (engineState !== 'loaded' || currentSrc !== expectedUrl) {
        engineRef.current.load(currentSongRef.current.filePath, false);
      }
      
      engineRef.current.seek(time);
      setUiState((prev: PlayerUiState) => ({ ...prev, progress: time }));
    }
  }, []);


  const getAnalyser = useCallback(() => {
    return engineRef.current?.getAnalyser() || null;
  }, []);

  useMediaSession({
    currentSong: uiState.currentSong,
    isPlaying: uiState.isPlaying,
    progress: uiState.progress,
    duration: uiState.duration,
    play,
    pause,
    next,
    prev,
    seek,
  });

  const contextValue = useMemo(() => ({
    currentSong: uiState.currentSong,
    isPlaying: uiState.isPlaying,
    progress: uiState.progress,
    duration: uiState.duration,
    volume,
    queue,
    history,
    repeatMode,
    isShuffle,
    updateCurrentSongMetadata,
    playNow,
    playNext,
    addToQueue,
    addSongsToQueue,
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
    toggleShuffle,
    getAnalyser
  }), [
    uiState.currentSong, uiState.isPlaying, uiState.progress, uiState.duration, volume, queue, history,
    repeatMode, isShuffle, updateCurrentSongMetadata, playNow, playNext, addToQueue, addSongsToQueue, playList,
    removeFromQueue, reorderQueue, play, pause, next, prev, seek,
    setVolume, toggleShuffle, getAnalyser, setRepeatMode
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};





