# Mobile storage schema (AsyncStorage) + desktop comparison

This document describes how the **Expo mobile app** persists data using **AsyncStorage** and how it maps to the **desktop Electron Store** schema.

## Goals

- Keep the same **logical model** as desktop (`library`, `songs`, `playlists`, `playerState`, `recentSearches`)
- Store them as **separate AsyncStorage keys** (string blobs)
- Add **versioning/migrations** so we can evolve schema safely

---

## Mobile keys (AsyncStorage)

All keys are **namespaced** to avoid collisions.

### Versioning

- `melovista:storageVersion`
  - **Type**: `"1"` (string)
  - **Meaning**: which schema version the stored data follows

### Library

- `melovista:libraryPlaylist`
  - **Type**: `Playlist` (JSON)
  - **Notes**: this is the special playlist with id `"0"` (the “Library”)

### Songs

- `melovista:songsById`
  - **Type**: `Record<string, Song>` (JSON)
  - **Notes**: canonical song map, keyed by `Song.id`

### Playlists

- `melovista:playlistsById`
  - **Type**: `Record<string, Playlist>` (JSON)
  - **Notes**: stores **user playlists only** (not the library playlist)

### Player state

- `melovista:playerState`
  - **Type**: `PlayerState | null` (JSON)

### Recent searches

- `melovista:recentSearches`
  - **Type**: `RecentSearch[]` (JSON)

---

## Desktop schema (Electron Store)

Desktop persistence is defined in `apps/desktop/electron/infrastructure/MainStorageAdapter.ts` as:

- `library: Playlist`
- `songs: Record<string, Song>`
- `playlists: Record<string, Playlist>`
- `playerState: PlayerState | null`
- `recentSearches: RecentSearch[]`

### 1:1 mapping (desktop → mobile)

- `library` → `melovista:libraryPlaylist`
- `songs` → `melovista:songsById`
- `playlists` → `melovista:playlistsById`
- `playerState` → `melovista:playerState`
- `recentSearches` → `melovista:recentSearches`

### “Library is also a playlist”

On desktop, `getPlaylists()` returns `{ '0': library, ...playlists }`. On mobile we do the same by _composing_:

```ts
{ '0': libraryPlaylist, ...playlistsById }
```

That way the UI can treat Library like any other playlist.

---

## v0 → v1 migration (pseudocode)

We treat “no version key present” as **v0**.

```ts
const v = await getItem('melovista:storageVersion')
if (v === null) {
  // v0 → v1: initialize any missing keys with defaults
  ensure songsById exists (default: {})
  ensure playlistsById exists (default: {})
  ensure recentSearches exists (default: [])
  ensure playerState exists (default: null)
  ensure libraryPlaylist exists (default: a Playlist with id '0')
  set storageVersion = '1'
}
```

Implementation detail: in code we do this once at app start inside the storage adapter (“hydrate” step).
