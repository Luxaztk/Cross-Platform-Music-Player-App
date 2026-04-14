import type { Playlist } from '@music/types'

export function composePlaylists(
  library: Playlist,
  playlists: Record<string, Playlist>,
): Record<string, Playlist> {
  // Match desktop behavior: always include library under id "0".
  return { '0': library, ...playlists }
}
