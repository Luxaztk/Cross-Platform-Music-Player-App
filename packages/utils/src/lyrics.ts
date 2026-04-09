import { splitArtists, ARTIST_SEPARATOR_REGEX } from './splitArtists';

/**
 * Normalizes a string to NFC and trims it.
 * Used to fix common encoding issues where UTF-8 characters are misread.
 */
export function normalizeNFC(str: string): string {
  if (!str) return '';
  try {
    return str.normalize('NFC').trim();
  } catch {
    return str.trim();
  }
}

/**
 * Cleans music titles by removing common suffixes like "Official MV", "Lyrics Video", etc.
 */
export function cleanLyricsTitle(title: string): string {
  if (!title) return '';
  return normalizeNFC(title)
    .replace(/[([][^\])]*(Official|Lyrics|Music|Audio|Video|MV|Visualizer)[^\])]*[\])]/gi, '')
    .replace(/\(Cover\)/gi, '')
    .replace(/\(Live\)/gi, '')
    .replace(ARTIST_SEPARATOR_REGEX, ' & ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts the primary artist name from a string of artists.
 * Handles separators using the unified splitArtists utility.
 */
export function getPrimaryArtist(artist: string | undefined): string {
  if (!artist || artist.toLowerCase().includes('unknown')) {
    return '';
  }
  const artists = splitArtists(artist);
  return artists.length > 0 ? artists[0] : '';
}

/**
 * Formats a search query based on song information.
 * Uses the format: "Song Name - Artist"
 */
export function formatLyricsSearchQuery(title: string, artist: string | undefined): string {
  const primaryArtist = getPrimaryArtist(artist);
  const cleanTitle = cleanLyricsTitle(title);

  if (!primaryArtist) return cleanTitle;
  return `${cleanTitle} - ${primaryArtist}`.trim();
}
