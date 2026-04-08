/**
 * Comprehensive regex for multiple artist delimiters
 * 1. Common separators: , ; / & |
 * 2. Featuring variants: ft, feat, featuring, with (handles optional dot)
 * 3. Collaboration indicators: x, and (using word boundaries)
 */
export const ARTIST_SEPARATOR_REGEX = /\s*(?:[,;\/&|]|(?:\bft\b\.?)|(?:\bfeat\b\.?)|(?:\bfeaturing\b)|(?:\bx\b)|(?:\band\b)|(?:\bwith\b))\s*/i;

export function splitArtists(artistString: string): string[] {
  if (!artistString || artistString === 'Unknown Artist') return ['Unknown Artist'];
  
  return artistString
    .split(ARTIST_SEPARATOR_REGEX)
    .map(a => a.trim())
    .filter(a => a.length > 0);
}
