import type { Song, PlaybackContext, PlaybackExclusionSettings } from '@music/types';

export interface ExclusionIndex {
  songIds: Set<string>;
  albums: Set<string>;
  playlists: Set<string>;
}

export const buildExclusionIndex = (settings?: Partial<PlaybackExclusionSettings>): ExclusionIndex => {
  return {
    songIds: new Set(settings?.excludedSongIds || []),
    albums: new Set((settings?.excludedAlbums || []).map((a) => a.toLowerCase().trim())),
    playlists: new Set(settings?.excludedPlaylists || []),
  };
};

/**
 * Checks if a song is configured to be excluded from default library/shuffle playback.
 */
export const isSongExcludedFromDefault = (
  song: Song,
  indexOrSettings?: ExclusionIndex | PlaybackExclusionSettings
): boolean => {
  if (song.excludeFromDefault) return true;
  if (!indexOrSettings) return false;

  const index: ExclusionIndex =
    'songIds' in indexOrSettings
      ? indexOrSettings
      : buildExclusionIndex(indexOrSettings);

  if (song.id && index.songIds.has(song.id)) return true;

  if (song.album) {
    const normAlbum = song.album.toLowerCase().trim();
    if (index.albums.has(normAlbum)) return true;
  }

  return false;
};

/**
 * Evaluates whether a song should play in the given context.
 *
 * Rules:
 * 1. If context is explicit (e.g. user directly clicked the song, opened the specific album/playlist,
 *    or filtered by artist/album via whitelist): ALWAYS PLAY (100% trọn vẹn).
 * 2. If context is general library playback (Library / Shuffle All / Autoplay):
 *    Exclude songs that are marked excludeFromDefault or belong to excluded albums/playlists.
 */
export const shouldPlaySongInContext = (
  song: Song,
  context: PlaybackContext = { type: 'library', isExplicit: false },
  indexOrSettings?: ExclusionIndex | PlaybackExclusionSettings
): boolean => {
  // If the user explicitly chose this context, always allow playback!
  if (context.isExplicit || context.type === 'direct') {
    return true;
  }

  if (!indexOrSettings && !song.excludeFromDefault) {
    return true;
  }

  const index = indexOrSettings
    ? 'songIds' in indexOrSettings
      ? indexOrSettings
      : buildExclusionIndex(indexOrSettings)
    : { songIds: new Set<string>(), albums: new Set<string>(), playlists: new Set<string>() };

  // If playlist itself is excluded in general playback
  if (context.type === 'playlist' && context.id && index.playlists.has(context.id)) {
    return false;
  }

  return !isSongExcludedFromDefault(song, index);
};

/**
 * Filters an array of songs, removing any that should be excluded from the given context.
 */
export const filterPlayableSongs = (
  songs: Song[],
  context: PlaybackContext = { type: 'library', isExplicit: false },
  indexOrSettings?: ExclusionIndex | PlaybackExclusionSettings
): Song[] => {
  if (context.isExplicit || context.type === 'direct') {
    return songs;
  }
  const index = indexOrSettings
    ? 'songIds' in indexOrSettings
      ? indexOrSettings
      : buildExclusionIndex(indexOrSettings)
    : undefined;

  return songs.filter((song) => shouldPlaySongInContext(song, context, index));
};
