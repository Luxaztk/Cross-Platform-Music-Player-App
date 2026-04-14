/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as FileSystem from 'expo-file-system'

import type { Playlist, RecentSearch, Song } from '@music/types'

import { MobileStorageAdapter } from '../../infrastructure/storage'
import { importPickedAudioAssets } from './importAudio'

type LibraryState = {
  isHydrated: boolean
  songsById: Record<string, Song>
  library: Playlist
  playlistsById: Record<string, Playlist>
  recentSearches: RecentSearch[]
}

type LibraryContextValue = LibraryState & {
  refresh: () => Promise<void>
  importPickedAudio: (
    assets: { uri: string; name?: string | null }[],
  ) => Promise<{ imported: number; skippedDuplicates: number }>
  createPlaylist: (name: string) => Promise<Playlist>
  renamePlaylist: (id: string, name: string) => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
  addSongsToPlaylist: (playlistId: string, songIds: string[]) => Promise<void>
  removeSongsFromPlaylist: (playlistId: string, songIds: string[]) => Promise<void>
  deleteSongs: (songIds: string[]) => Promise<void>
  addRecentSearch: (query: string) => Promise<void>
  removeRecentSearch: (text: string) => Promise<void>
  clearRecentSearches: () => Promise<void>
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

const storage = new MobileStorageAdapter()

function defaultLibrary(): Playlist {
  return {
    id: '0',
    name: 'Library',
    description: 'All your songs',
    songIds: [],
    createdAt: new Date().toISOString(),
  }
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LibraryState>({
    isHydrated: false,
    songsById: {},
    library: defaultLibrary(),
    playlistsById: {},
    recentSearches: [],
  })

  const refresh = useCallback(async () => {
    const [songsById, library, playlistsById, recentSearches] = await Promise.all([
      storage.getSongs(),
      storage.getLibrary(),
      storage.getPlaylists(),
      storage.getRecentSearches(),
    ])

    setState({
      isHydrated: true,
      songsById,
      library,
      playlistsById,
      recentSearches,
    })
  }, [])

  const importPickedAudio = useCallback(
    async (assets: { uri: string; name?: string | null }[]) => {
      const existingSourceUris = new Set(
        Object.values(state.songsById)
          .map((s) => s.sourceUrl)
          .filter((u): u is string => !!u),
      )

      const { songs: importedSongs, skippedDuplicates } = await importPickedAudioAssets(assets, {
        existingSourceUris,
      })

      const nextSongsById = { ...state.songsById }
      for (const s of importedSongs) {
        nextSongsById[s.id] = s
      }

      const nextLibrary: Playlist = {
        ...state.library,
        songIds: [...state.library.songIds],
      }

      for (const s of importedSongs) {
        if (!nextLibrary.songIds.includes(s.id)) {
          nextLibrary.songIds.push(s.id)
        }
      }

      await Promise.all([storage.saveSongs(nextSongsById), storage.saveLibrary(nextLibrary)])

      setState((prev) => ({
        ...prev,
        isHydrated: true,
        songsById: nextSongsById,
        library: nextLibrary,
      }))

      return { imported: importedSongs.length, skippedDuplicates }
    },
    [state.library, state.songsById],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createPlaylist = useCallback(
    async (name: string): Promise<Playlist> => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
      const playlist: Playlist = {
        id,
        name: name.trim(),
        description: '',
        songIds: [],
        createdAt: new Date().toISOString(),
      }

      const next = { ...state.playlistsById, [id]: playlist }
      await storage.savePlaylists(next)
      setState((prev) => ({ ...prev, playlistsById: next }))
      return playlist
    },
    [state.playlistsById],
  )

  const renamePlaylist = useCallback(
    async (id: string, name: string) => {
      const existing = state.playlistsById[id]
      if (!existing || id === '0') return
      const updated = { ...existing, name: name.trim() }
      const next = { ...state.playlistsById, [id]: updated }
      await storage.savePlaylists(next)
      setState((prev) => ({ ...prev, playlistsById: next }))
    },
    [state.playlistsById],
  )

  const deletePlaylist = useCallback(
    async (id: string) => {
      if (id === '0') return
      const next = { ...state.playlistsById }
      delete next[id]
      await storage.savePlaylists(next)
      setState((prev) => ({ ...prev, playlistsById: next }))
    },
    [state.playlistsById],
  )

  const addSongsToPlaylist = useCallback(
    async (playlistId: string, songIds: string[]) => {
      const existing = state.playlistsById[playlistId]
      if (!existing || playlistId === '0') return

      const nextSongIds = [...existing.songIds]
      for (const id of songIds) {
        if (!nextSongIds.includes(id)) {
          nextSongIds.push(id)
        }
      }

      const updated = { ...existing, songIds: nextSongIds }
      const next = { ...state.playlistsById, [playlistId]: updated }
      await storage.savePlaylists(next)
      setState((prev) => ({ ...prev, playlistsById: next }))
    },
    [state.playlistsById],
  )

  const removeSongsFromPlaylist = useCallback(
    async (playlistId: string, songIds: string[]) => {
      const existing = state.playlistsById[playlistId]
      if (!existing || playlistId === '0') return

      const nextSongIds = existing.songIds.filter((id) => !songIds.includes(id))

      const updated = { ...existing, songIds: nextSongIds }
      const next = { ...state.playlistsById, [playlistId]: updated }
      await storage.savePlaylists(next)
      setState((prev) => ({ ...prev, playlistsById: next }))
    },
    [state.playlistsById],
  )

  const deleteSongs = useCallback(
    async (songIds: string[]) => {
      const nextSongsById = { ...state.songsById }
      const nextLibrary = {
        ...state.library,
        songIds: state.library.songIds.filter((id) => !songIds.includes(id)),
      }
      const nextPlaylistsById = { ...state.playlistsById }

      for (const id of songIds) {
        const song = state.songsById[id]
        if (song) {
          try {
            await FileSystem.deleteAsync(song.filePath, { idempotent: true })
          } catch (e) {
            console.error('Failed to delete file', song.filePath, e)
          }
          delete nextSongsById[id]
        }
      }

      // Filter all playlists
      for (const pid in nextPlaylistsById) {
        nextPlaylistsById[pid] = {
          ...nextPlaylistsById[pid],
          songIds: nextPlaylistsById[pid].songIds.filter((id) => !songIds.includes(id)),
        }
      }

      await Promise.all([
        storage.saveSongs(nextSongsById),
        storage.saveLibrary(nextLibrary),
        storage.savePlaylists(nextPlaylistsById),
      ])

      setState((prev) => ({
        ...prev,
        songsById: nextSongsById,
        library: nextLibrary,
        playlistsById: nextPlaylistsById,
      }))
    },
    [state.songsById, state.library, state.playlistsById],
  )

  const addRecentSearch = useCallback(
    async (query: string) => {
      const text = query.trim()
      if (!text) return

      // Move to top if exists, otherwise prepend
      let next = [
        { type: 'query' as const, text, timestamp: Date.now() },
        ...state.recentSearches.filter((s) => s.type !== 'query' || s.text !== text),
      ]

      if (next.length > 20) {
        next = next.slice(0, 20)
      }

      await storage.saveRecentSearches(next)
      setState((prev) => ({ ...prev, recentSearches: next }))
    },
    [state.recentSearches],
  )

  const removeRecentSearch = useCallback(
    async (text: string) => {
      const next = state.recentSearches.filter((s) => s.type !== 'query' || s.text !== text)
      await storage.saveRecentSearches(next)
      setState((prev) => ({ ...prev, recentSearches: next }))
    },
    [state.recentSearches],
  )

  const clearRecentSearches = useCallback(async () => {
    await storage.saveRecentSearches([])
    setState((prev) => ({ ...prev, recentSearches: [] }))
  }, [])

  const value = useMemo<LibraryContextValue>(
    () => ({
      ...state,
      refresh,
      importPickedAudio,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongsToPlaylist,
      removeSongsFromPlaylist,
      deleteSongs,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,
    }),
    [
      state,
      refresh,
      importPickedAudio,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addSongsToPlaylist,
      removeSongsFromPlaylist,
      deleteSongs,
      addRecentSearch,
      removeRecentSearch,
      clearRecentSearches,
    ],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
