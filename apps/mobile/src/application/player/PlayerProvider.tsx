import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import type { PlayerState, Song } from '@music/types'

import { MobileStorageAdapter } from '../../infrastructure/storage'
import { useLanguage } from '../../i18n'
import { useLibrary } from '../library/LibraryProvider'
import { PlayerService, type PlayerProgress } from './PlayerService'

type PlayerStateContextValue = {
  state: PlayerState
  currentSong: Song | null

  playFromQueue: (
    queueIds: string[],
    startSongId: string,
    contextIds?: string[],
  ) => Promise<{ ok: true } | { ok: false; error: 'AUDIO_MODULE_UNAVAILABLE' | 'UNKNOWN' }>
  togglePlayPause: () => Promise<void>
  playNext: () => Promise<void>
  playPrevious: () => Promise<void>

  setVolume: (volume01: number) => Promise<void>
  setShuffle: (isShuffle: boolean) => Promise<void>
  setRepeatMode: (mode: PlayerState['repeatMode']) => Promise<void>
  seekTo: (positionMs: number) => Promise<void>
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

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { songsById, deleteSongs } = useLibrary()
  const { t } = useLanguage()
  const [service] = useState(() => new PlayerService())

  const [state, setState] = useState<PlayerState>(defaultPlayerState())
  const [progress, setProgress] = useState<PlayerProgress>({
    isLoaded: false,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
  })

  const currentSong = state.currentSongId ? (songsById[state.currentSongId] ?? null) : null

  // Hydrate persisted player state (AsyncStorage)
  useEffect(() => {
    ;(async () => {
      const saved = await storage.getPlayerState()
      if (saved) {
        setState(saved)
        await service.setVolume(clamp01(saved.volume))
      }
    })()
  }, [service])

  // Subscribe to playback progress updates
  useEffect(() => {
    const unsub = service.subscribe(setProgress)
    return () => {
      unsub?.()
    }
  }, [service])

  const persist = useCallback(async (next: PlayerState) => {
    setState(next)
    await storage.savePlayerState(next)
  }, [])

  const playSongId = useCallback(
    async (songId: string) => {
      const song = songsById[songId]
      if (!song) return
      try {
        await service.load(song.filePath, { shouldPlay: true })
        await service.setVolume(clamp01(state.volume))
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
    [songsById, state.volume, service, t, deleteSongs],
  )

  const playFromQueue = useCallback(
    async (queueIds: string[], startSongId: string, contextIds?: string[]) => {
      const next: PlayerState = {
        ...state,
        queueIds: [...queueIds],
        currentSongId: startSongId,
        // Reset history when you start a new explicit session
        historyIds: [],
        originalContextIds: contextIds ? [...contextIds] : [...queueIds],
      }
      await persist(next)
      try {
        await playSongId(startSongId)
        return { ok: true } as const
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? typeof (err as { message?: unknown }).message === 'string'
              ? ((err as { message: string }).message as string)
              : ''
            : ''
        if (msg === 'AUDIO_MODULE_UNAVAILABLE') {
          return { ok: false, error: 'AUDIO_MODULE_UNAVAILABLE' } as const
        }
        return { ok: false, error: 'UNKNOWN' } as const
      }
    },
    [persist, playSongId, state],
  )

  const togglePlayPause = useCallback(async () => {
    await service.togglePlayPause()
  }, [service])

  const seekTo = useCallback(
    async (positionMs: number) => {
      await service.seekTo(positionMs)
    },
    [service],
  )

  const pickNextId = useCallback((s: PlayerState): string | null => {
    if (!s.currentSongId) return s.queueIds[0] ?? null
    if (s.repeatMode === 'ONE') return s.currentSongId

    if (s.isShuffle) {
      const candidates = s.queueIds.filter((id) => id !== s.currentSongId)
      if (candidates.length === 0) return s.repeatMode === 'ALL' ? s.currentSongId : null
      return candidates[Math.floor(Math.random() * candidates.length)]
    }

    const idx = s.queueIds.indexOf(s.currentSongId)
    if (idx < 0) return s.queueIds[0] ?? null
    const next = s.queueIds[idx + 1]
    if (next) return next
    return s.repeatMode === 'ALL' ? (s.queueIds[0] ?? null) : null
  }, [])

  const playNext = useCallback(async () => {
    const nextId = pickNextId(state)
    if (!nextId) return

    const next: PlayerState = {
      ...state,
      currentSongId: nextId,
      historyIds: state.currentSongId
        ? [...state.historyIds, state.currentSongId]
        : [...state.historyIds],
    }
    await persist(next)
    try {
      await playSongId(nextId)
    } catch {
      // swallow to avoid unhandled rejection; UI can surface errors via callers when needed
    }
  }, [persist, pickNextId, playSongId, state])

  const playPrevious = useCallback(async () => {
    if (state.historyIds.length === 0) return
    const prevId = state.historyIds[state.historyIds.length - 1]
    const nextHistory = state.historyIds.slice(0, -1)

    const next: PlayerState = {
      ...state,
      currentSongId: prevId,
      historyIds: nextHistory,
    }
    await persist(next)
    try {
      await playSongId(prevId)
    } catch {
      // swallow to avoid unhandled rejection
    }
  }, [persist, playSongId, state])

  const setVolume = useCallback(
    async (volume01: number) => {
      const v = clamp01(volume01)
      const next: PlayerState = { ...state, volume: v }
      await persist(next)
      await service.setVolume(v)
    },
    [persist, service, state],
  )

  const setShuffle = useCallback(
    async (isShuffle: boolean) => {
      const next: PlayerState = { ...state, isShuffle }
      await persist(next)
    },
    [persist, state],
  )

  const setRepeatMode = useCallback(
    async (mode: PlayerState['repeatMode']) => {
      const next: PlayerState = { ...state, repeatMode: mode }
      await persist(next)
    },
    [persist, state],
  )

  const stateValue = useMemo<PlayerStateContextValue>(
    () => ({
      state,
      currentSong,
      playFromQueue,
      togglePlayPause,
      playNext,
      playPrevious,
      setVolume,
      setShuffle,
      setRepeatMode,
      seekTo,
    }),
    [
      state,
      currentSong,
      playFromQueue,
      togglePlayPause,
      playNext,
      playPrevious,
      setVolume,
      setShuffle,
      setRepeatMode,
      seekTo,
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
