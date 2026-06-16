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
  playNextSongs: (songIds: string[]) => Promise<void>
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
  clearQueue: () => Promise<void>
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
  const { songsById, library, isHydrated: isLibraryHydrated, deleteSongs } = useLibrary()
  const { t } = useLanguage()
  const [service] = useState(() => new PlayerService())

  const [state, setState] = useState<PlayerState>(defaultPlayerState())
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [isPlayerHydrated, setIsPlayerHydrated] = useState(false)

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

  const logQueueDebug = useCallback((items: QueueItem[]) => {
    const debug = items.map(q => {
      const title = (songsById[q.id]?.title ?? 'Unknown').substring(0, 10)
      return `${q.id} (${title})`
    }).join(' -> ')
    console.log(`[QUEUE DEBUG] ${debug || 'Queue is empty'}`)
  }, [songsById])

  const logRotationDebug = useCallback((songIds: string[], startIndex: number, rotatedIds: string[]) => {
    console.log('[Player] Rotation Debug:')
    console.log(`  - Input length: ${songIds.length}`)
    console.log(`  - Start Index: ${startIndex} (Song: ${songIds[startIndex]})`)
    console.log(`  - Rotated length: ${rotatedIds.length}`)
    console.log(`  - First 3 in rotated: ${rotatedIds.slice(0, 3).join(', ')}`)
    console.log(`  - Last 3 in rotated: ${rotatedIds.slice(-3).join(', ')}`)
  }, [])

  // Hydrate persisted player state (AsyncStorage)
  // "Hydrate" here means "restore the in-memory player state from the persisted storage." Concretely: read the saved state from AsyncStorage and merge or replace the app's current player state so the app resumes with the stored values (e.g., track, position, volume, playlist).
  useEffect(() => {
    ; (async () => {
      const saved = await storage.getPlayerState()
      if (saved) {
        const initialQueueItems = saved.queueIds.map(id => ({ uid: generateUid(), id }))
        setState(saved)
        setQueueItems(initialQueueItems)
        await service.setVolume(clamp01(saved.volume))
        // Log the restored queue
        logQueueDebug(initialQueueItems)
      }
      setIsPlayerHydrated(true)
    })()
  }, [service, generateUid, logQueueDebug])

  const hasInitializedRef = useRef(false)

  // Initialize queue from library if empty on first open
  /*
  useEffect(() => {
    if (!isPlayerHydrated || !isLibraryHydrated || hasInitializedRef.current) return
    if (queueItemsRef.current.length > 0) return

    const allSongs = library.songIds.map(id => songsById[id]).filter(Boolean) as Song[]
    if (allSongs.length === 0) return

    hasInitializedRef.current = true

    // Sort by title
    let sortedSongs = [...allSongs].sort((a, b) => {
      const aVal = a.title.toLowerCase()
      const bVal = b.title.toLowerCase()
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    })

    const originalIds = sortedSongs.map(s => s.id)
    let finalIds = [...originalIds]
    let initialSongId = stateRef.current.currentSongId

    if (initialSongId && finalIds.includes(initialSongId)) {
      const idx = finalIds.indexOf(initialSongId)
      if (idx !== -1) {
        // Full Rotation: [A, B, C, D] -> [D, A, B] if C is current
        const rotated = [...finalIds.slice(idx + 1), ...finalIds.slice(0, idx)]
        finalIds = rotated
      }
    } else {
      initialSongId = finalIds[0]
      finalIds = finalIds.slice(1)
    }

    // Apply shuffle if enabled in saved state
    if (stateRef.current.isShuffle) {
      finalIds = shuffleArray(finalIds)
    }

    const items = finalIds.map(id => ({ uid: generateUid(), id }))
    const nextState = { 
      ...stateRef.current, 
      currentSongId: initialSongId, 
      queueIds: finalIds,
      originalContextIds: originalIds 
    }
    
    setState(nextState)
    setQueueItems(items)
    stateRef.current = nextState
    queueItemsRef.current = items
    
    void storage.savePlayerState(nextState)
    
    console.log(`[Player] Initialized queue with ${finalIds.length} songs from library. Initial song: ${initialSongId}`)
    logQueueDebug(items)
  }, [isPlayerHydrated, isLibraryHydrated, library.songIds, songsById, generateUid, logQueueDebug])
  */

  // Monitor for unexpected queue clearing
  useEffect(() => {
    if (isPlayerHydrated && queueItems.length === 0) {
      console.log('[Player] MONITOR: Queue is now empty.')
    }
  }, [queueItems.length, isPlayerHydrated])

  const playSongId = useCallback(
    async (songId: string) => {
      const song = songsById[songId]
      if (!song) return
      try {
        await service.load(song.filePath, { shouldPlay: true })
        await service.setVolume(clamp01(stateRef.current.volume))
        await service.setLoop(stateRef.current.repeatMode === 'ONE')
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

  const next = useCallback(async () => {
    const s = stateRef.current
    const items = queueItemsRef.current

    let nextId: string | null = null
    let nextQueueItems = [...items]

    if (s.repeatMode === 'ONE') {
      nextId = s.currentSongId
      console.log('[Player] Skip Next: Repeat ONE active.')
    } else if (items.length > 0) {
      // Pick first from queue
      nextId = items[0].id

      if (s.repeatMode === 'ALL' && s.currentSongId) {
        // Loop All: Move current song to end of queue to keep it circular
        nextQueueItems = [...items.slice(1), { uid: generateUid(), id: s.currentSongId }]
        console.log(`[Player] Skip Next: Loop ALL active. Moved ${s.currentSongId} to end of queue.`)
      } else {
        // No Loop (OFF): Just pop
        nextQueueItems.shift()
        console.log(`[Player] Skip Next: Popped from queue. New queue length: ${nextQueueItems.length}`)
      }
    } else if (s.repeatMode === 'ALL' && s.currentSongId) {
      // Special case: Queue empty but looping ALL (usually 1 song context)
      nextId = s.currentSongId
      console.log('[Player] Skip Next: Loop ALL active with empty queue (single song).')
    } else {
      console.log('[Player] Skip Next: Queue empty and Repeat OFF. Stopping.')
    }

    if (!nextId) {
      console.log('[Player] Skip Next: No next song found.')
      await service.pause()
      await service.seekTo(0)
      return
    }

    const nextState: PlayerState = {
      ...s,
      currentSongId: nextId,
      historyIds: s.currentSongId && s.repeatMode !== 'ONE'
        ? [...s.historyIds, s.currentSongId].slice(-32)
        : [...s.historyIds],
    }

    console.log(`[PlayerProvider] Skipping to next: ${nextId}. Remaining in queue: ${nextQueueItems.length}`)

    // Update local state and refs immediately to prevent race conditions
    setState(nextState)
    setQueueItems(nextQueueItems)
    stateRef.current = nextState
    queueItemsRef.current = nextQueueItems

    // Fire and forget storage save
    void storage.savePlayerState({ ...nextState, queueIds: nextQueueItems.map(q => q.id) })

    logQueueDebug(nextQueueItems)
    try {
      await playSongId(nextId!)
    } catch (err) {
      console.error(`[PlayerProvider] Failed to skip to next:`, err)
    }
  }, [generateUid, service, playSongId, logQueueDebug])

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

  const playList = useCallback(
    async (songIds: string[], startIndex: number) => {
      const startSongId = songIds[startIndex]
      const nextHistory = stateRef.current.currentSongId
        ? pushToHistory(stateRef.current.currentSongId)
        : stateRef.current.historyIds

      // Based on __MOBILE_playback_modes.md:
      let upcomingIds: string[] = []

      if (stateRef.current.repeatMode === 'ALL') {
        // Loop All: Full rotation starting from next song
        upcomingIds = [...songIds.slice(startIndex + 1), ...songIds.slice(0, startIndex)]
      } else if (stateRef.current.repeatMode === 'ONE') {
        // Loop One: Empty queue (just play current)
        upcomingIds = []
      } else {
        // No Loop (OFF): Truncated list
        upcomingIds = songIds.slice(startIndex + 1)
      }

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
      logQueueDebug(nextQueueItems)
      await playSongId(startSongId)
    },
    [persist, playSongId, generateUid, pushToHistory, logQueueDebug],
  )

  const playNow = useCallback(async (songId: string) => {
    const nextHistory = stateRef.current.currentSongId
      ? pushToHistory(stateRef.current.currentSongId)
      : stateRef.current.historyIds

    const nextState = {
      ...stateRef.current,
      currentSongId: songId,
      historyIds: nextHistory,
      originalContextIds: [songId] // Reset context to this single song
    }
    await persist(nextState, queueItemsRef.current)
    await playSongId(songId)
  }, [persist, playSongId, pushToHistory])

  const playNext = useCallback(async (songId: string) => {
    const nextItems = [{ uid: generateUid(), id: songId }, ...queueItemsRef.current]
    await persist(stateRef.current, nextItems)
  }, [persist, generateUid])

  const playNextSongs = useCallback(async (songIds: string[]) => {
    const newItems = songIds.map(id => ({ uid: generateUid(), id }))
    const nextItems = [...newItems, ...queueItemsRef.current]
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

  const clearQueue = useCallback(async () => {
    await persist(stateRef.current, [])
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
          // Restore relative order based on original context
          const upcomingIds = s.originalContextIds.slice(idx + 1)
          nextQueueItems = upcomingIds.map((id) => ({ uid: generateUid(), id }))
        }
      }
    }

    const nextState: PlayerState = { ...s, isShuffle }
    await persist(nextState, nextQueueItems)
    console.log(`[Player] Shuffle toggled to: ${isShuffle}`)
    logQueueDebug(nextQueueItems)
  }, [persist, generateUid, logQueueDebug])

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
    if (stateRef.current.repeatMode === 'ONE') {
      await service.seekTo(0)
      return
    }

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
        console.log(`[PlayerProvider] Skipping to prev: ${prevId}. Queue length after push back: ${nextItems.length}`)

        // Update local state and refs immediately
        setState(nextState)
        setQueueItems(nextItems)
        stateRef.current = nextState
        queueItemsRef.current = nextItems

        // Fire and forget storage save
        void storage.savePlayerState({ ...nextState, queueIds: nextItems.map(q => q.id) })

        logQueueDebug(nextItems)
        try {
          await playSongId(prevId)
        } catch (err) {
          console.error(`[PlayerProvider] Failed to skip to prev:`, err)
        }
      } else {
        await service.seekTo(0)
      }
    }
  }, [generateUid, service, playSongId, logQueueDebug])

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
    await service.setLoop(mode === 'ONE')
    console.log(`[Player] Repeat mode changed to: ${mode}`)
    logQueueDebug(queueItemsRef.current)
  }, [persist, service, logQueueDebug])

  const stateValue = useMemo<PlayerStateContextValue>(
    () => ({
      state,
      currentSong,
      queueItems,
      playNow,
      playNext,
      playNextSongs,
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
      clearQueue,
    }),
    [
      state,
      currentSong,
      queueItems,
      playNow,
      playNext,
      playNextSongs,
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
      clearQueue,
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
