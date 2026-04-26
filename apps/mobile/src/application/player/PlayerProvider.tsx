import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef, useLayoutEffect } from 'react'
import { Alert } from 'react-native'

import type { PlayerState, Song } from '@music/types'

import { MobileStorageAdapter } from '../../infrastructure/storage'
import { useLanguage } from '../../presentations/components/Language'
import { useLibrary } from '../library/LibraryProvider'
import { PlayerService, type PlayerProgress } from './PlayerService'

export type QueueItem = {
  uid: string
  id: string
}

type PlayerStateContextValue = {
  state: PlayerState
  currentSong: Song | null
  queueItems: QueueItem[]

  playNow: (songId: string) => Promise<void>
  playNext: (songId: string) => Promise<void>
  addToQueue: (songId: string) => Promise<void>
  addSongsToQueue: (songIds: string[]) => Promise<void>
  playList: (songIds: string[], startIndex: number) => Promise<void>
  removeFromQueue: (index: number) => Promise<void>
  reorderQueue: (startIndex: number, endIndex: number) => Promise<void>

  play: () => Promise<void>
  pause: () => Promise<void>
  togglePlayPause: () => Promise<void>
  next: () => Promise<void>
  prev: () => Promise<void>
  seekTo: (positionMs: number) => Promise<void>
  setVolume: (volume01: number) => Promise<void>
  setRepeatMode: (mode: PlayerState['repeatMode']) => Promise<void>
  toggleShuffle: () => Promise<void>
}

type PlayerProgressContextValue = PlayerProgress

const PlayerStateContext = createContext<PlayerStateContextValue | null>(null)
const PlayerProgressContext = createContext<PlayerProgressContextValue | null>(null)

const storage = new MobileStorageAdapter()

function defaultPlayerState(): PlayerState {
  return {
    currentSongId: null,
    queueIds: [],
    historyIds: [],
    originalContextIds: [],
    volume: 1,
    repeatMode: 'OFF',
    isShuffle: false,
  }
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { songsById, deleteSongs } = useLibrary()
  const { t } = useLanguage()
  const [service] = useState(() => new PlayerService())

  const [state, setState] = useState<PlayerState>(defaultPlayerState())
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  
  const [progress, setProgress] = useState<PlayerProgress>({
    isLoaded: false,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
  })

  const currentSong = state.currentSongId ? (songsById[state.currentSongId] ?? null) : null

  const generateUid = useCallback(() => Math.random().toString(36).substring(2, 11) + Date.now().toString(36), [])

  // To prevent stale closures in progress listener
  const stateRef = useRef(state)
  const queueItemsRef = useRef(queueItems)
  const progressRef = useRef(progress)
  
  useLayoutEffect(() => {
    stateRef.current = state
    queueItemsRef.current = queueItems
    progressRef.current = progress
  })

  const persist = useCallback(async (nextState: PlayerState, nextQueueItems: QueueItem[]) => {
    setState(nextState)
    setQueueItems(nextQueueItems)
    const stateToSave = { ...nextState, queueIds: nextQueueItems.map(q => q.id) }
    await storage.savePlayerState(stateToSave)
  }, [])

  // Hydrate persisted player state (AsyncStorage)
  useEffect(() => {
    ;(async () => {
      const saved = await storage.getPlayerState()
      if (saved) {
        const initialQueueItems = saved.queueIds.map(id => ({ uid: generateUid(), id }))
        setState(saved)
        setQueueItems(initialQueueItems)
        await service.setVolume(clamp01(saved.volume))
      }
    })()
  }, [service, generateUid])

  const next = useCallback(async () => {
    const s = stateRef.current
    const items = queueItemsRef.current

    let nextId: string | null = null
    let nextQueueItems = [...items]

    if (s.repeatMode === 'ONE' && s.currentSongId) {
      // Repeat ONE just plays the same song again, queue doesn't shift
      nextId = s.currentSongId
    } else if (items.length > 0) {
      // Standard queue pop
      nextId = items[0].id
      nextQueueItems.shift()
    } else if (s.repeatMode === 'ALL' && s.originalContextIds.length > 0) {
      // Repeat ALL loops back to start
      let newIds = [...s.originalContextIds]
      if (s.isShuffle) {
        newIds = shuffleArray(newIds)
      }
      nextId = newIds[0]
      nextQueueItems = newIds.slice(1).map(id => ({ uid: generateUid(), id }))
    }

    if (!nextId) {
      await service.pause()
      await service.seekTo(0)
      return
    }

    const nextState: PlayerState = {
      ...s,
      currentSongId: nextId,
      historyIds: s.currentSongId
        ? [...s.historyIds, s.currentSongId].slice(-32) // Keep last 32 history items
        : [...s.historyIds],
    }

    await persist(nextState, nextQueueItems)
    try {
      // Wait a tick so state resolves before playing, avoiding race conditions in UI.
      setTimeout(() => { playSongId(nextId!) }, 0)
    } catch {
      // swallow
    }
  }, [persist, generateUid, service])

  // Subscribe to playback progress updates + simulate onEnd
  useEffect(() => {
    const unsub = service.subscribe((p) => {
      setProgress(p)
      
      // Auto-play next track logic
      if (p.isLoaded && p.didJustFinish) {
        void next()
      }
    })
    return () => {
      unsub?.()
    }
  }, [service, next])

  const playSongId = useCallback(
    async (songId: string) => {
      const song = songsById[songId]
      if (!song) return
      try {
        await service.load(song.filePath, { shouldPlay: true })
        await service.setVolume(clamp01(stateRef.current.volume))
        await service.setActiveForLockScreen(true, {
          title: song.title,
          artist: song.artist,
          albumTitle: song.album,
        })
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'FILE_NOT_FOUND') {
          Alert.alert(t.library.fileNotFound, t.library.fileNotFoundMessage, [
            { text: t.playlists.cancel, style: 'cancel' },
            {
              text: t.library.removeFromLibrary,
              style: 'destructive',
              onPress: () => {
                void deleteSongs([songId])
              },
            },
          ])
        }
        throw err
      }
    },
    [songsById, service, t, deleteSongs],
  )

  const pushToHistory = useCallback((songId: string) => {
    return [...stateRef.current.historyIds, songId].slice(-32)
  }, [])

  const playList = useCallback(
    async (songIds: string[], startIndex: number) => {
      const startSongId = songIds[startIndex]
      const nextHistory = stateRef.current.currentSongId 
        ? pushToHistory(stateRef.current.currentSongId) 
        : stateRef.current.historyIds

      let upcomingIds = songIds.slice(startIndex + 1)
      if (stateRef.current.isShuffle) {
        upcomingIds = shuffleArray(upcomingIds)
      }

      const nextQueueItems = upcomingIds.map(id => ({ uid: generateUid(), id }))
      const nextState: PlayerState = {
        ...stateRef.current,
        currentSongId: startSongId,
        originalContextIds: [...songIds],
        historyIds: nextHistory,
      }

      await persist(nextState, nextQueueItems)
      await playSongId(startSongId)
    },
    [persist, playSongId, generateUid, pushToHistory],
  )

  const playNow = useCallback(async (songId: string) => {
    const nextHistory = stateRef.current.currentSongId 
      ? pushToHistory(stateRef.current.currentSongId) 
      : stateRef.current.historyIds

    const nextState = { ...stateRef.current, currentSongId: songId, historyIds: nextHistory }
    await persist(nextState, queueItemsRef.current)
    await playSongId(songId)
  }, [persist, playSongId, pushToHistory])

  const playNext = useCallback(async (songId: string) => {
    const nextItems = [{ uid: generateUid(), id: songId }, ...queueItemsRef.current]
    await persist(stateRef.current, nextItems)
  }, [persist, generateUid])

  const addToQueue = useCallback(async (songId: string) => {
    const nextItems = [...queueItemsRef.current, { uid: generateUid(), id: songId }]
    await persist(stateRef.current, nextItems)
  }, [persist, generateUid])

  const addSongsToQueue = useCallback(async (songIds: string[]) => {
    const newItems = songIds.map(id => ({ uid: generateUid(), id }))
    const nextItems = [...queueItemsRef.current, ...newItems]
    await persist(stateRef.current, nextItems)
  }, [persist, generateUid])

  const removeFromQueue = useCallback(async (index: number) => {
    const nextItems = queueItemsRef.current.filter((_, i) => i !== index)
    await persist(stateRef.current, nextItems)
  }, [persist])

  const reorderQueue = useCallback(async (startIndex: number, endIndex: number) => {
    const result = Array.from(queueItemsRef.current)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    await persist(stateRef.current, result)
  }, [persist])

  const toggleShuffle = useCallback(async () => {
    const s = stateRef.current
    const isShuffle = !s.isShuffle
    
    let nextQueueItems = [...queueItemsRef.current]

    if (isShuffle) {
      nextQueueItems = shuffleArray(nextQueueItems)
    } else {
      const currentId = s.currentSongId
      if (currentId && s.originalContextIds.length > 0) {
        const idx = s.originalContextIds.findIndex((id) => id === currentId)
        if (idx !== -1) {
          const remainingIds = s.originalContextIds.slice(idx + 1)
          nextQueueItems = remainingIds.map((id) => ({ uid: generateUid(), id }))
        }
      }
    }

    const nextState: PlayerState = { ...s, isShuffle }
    await persist(nextState, nextQueueItems)
  }, [persist, generateUid])

  const play = useCallback(async () => {
    if (stateRef.current.currentSongId && !progressRef.current.isLoaded) {
      await playSongId(stateRef.current.currentSongId)
    } else {
      await service.play()
    }
  }, [service, playSongId])

  const pause = useCallback(async () => {
    await service.pause()
  }, [service])

  const togglePlayPause = useCallback(async () => {
    if (stateRef.current.currentSongId && !progressRef.current.isLoaded) {
      await playSongId(stateRef.current.currentSongId)
    } else {
      await service.togglePlayPause()
    }
  }, [service, playSongId])

  const prev = useCallback(async () => {
    if (progressRef.current.positionMs > 3000) {
      await service.seekTo(0)
    } else {
      const s = stateRef.current
      if (s.historyIds.length > 0) {
        const nextHistory = [...s.historyIds]
        const prevId = nextHistory.pop()!

        let nextItems = queueItemsRef.current
        if (s.currentSongId) {
          nextItems = [{ uid: generateUid(), id: s.currentSongId }, ...nextItems]
        }

        const nextState: PlayerState = {
          ...s,
          currentSongId: prevId,
          historyIds: nextHistory,
        }
        await persist(nextState, nextItems)
        await playSongId(prevId)
      } else {
        await service.seekTo(0)
      }
    }
  }, [persist, playSongId, generateUid, service])

  const seekTo = useCallback(async (positionMs: number) => {
    await service.seekTo(positionMs)
  }, [service])

  const setVolume = useCallback(async (volume01: number) => {
    const v = clamp01(volume01)
    const nextState: PlayerState = { ...stateRef.current, volume: v }
    await persist(nextState, queueItemsRef.current)
    await service.setVolume(v)
  }, [persist, service])

  const setRepeatMode = useCallback(async (mode: PlayerState['repeatMode']) => {
    const nextState: PlayerState = { ...stateRef.current, repeatMode: mode }
    await persist(nextState, queueItemsRef.current)
  }, [persist])

  const stateValue = useMemo<PlayerStateContextValue>(
    () => ({
      state,
      currentSong,
      queueItems,
      playNow,
      playNext,
      addToQueue,
      addSongsToQueue,
      playList,
      removeFromQueue,
      reorderQueue,
      play,
      pause,
      togglePlayPause,
      next,
      prev,
      seekTo,
      setVolume,
      setRepeatMode,
      toggleShuffle,
    }),
    [
      state,
      currentSong,
      queueItems,
      playNow,
      playNext,
      addToQueue,
      addSongsToQueue,
      playList,
      removeFromQueue,
      reorderQueue,
      play,
      pause,
      togglePlayPause,
      next,
      prev,
      seekTo,
      setVolume,
      setRepeatMode,
      toggleShuffle,
    ],
  )

  return (
    <PlayerStateContext.Provider value={stateValue}>
      <PlayerProgressContext.Provider value={progress}>{children}</PlayerProgressContext.Provider>
    </PlayerStateContext.Provider>
  )
}

export function usePlayerState() {
  const ctx = useContext(PlayerStateContext)
  if (!ctx) throw new Error('usePlayerState must be used within PlayerProvider')
  return ctx
}

export function usePlayerProgress() {
  const ctx = useContext(PlayerProgressContext)
  if (!ctx) throw new Error('usePlayerProgress must be used within PlayerProvider')
  return ctx
}

export function usePlayer() {
  const state = usePlayerState()
  const progress = usePlayerProgress()
  return useMemo(() => ({ ...state, progress }), [state, progress])
}
