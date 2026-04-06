export function splitArtists(artistString: string): string[] {
  if (!artistString || artistString === 'Unknown Artist') return ['Unknown Artist'];
  
  // Comprehensive regex for multiple delimiters
  // 1. Common separators: , ; / & |
  // 2. Featuring variants: ft, feat, featuring, with (handles optional dot)
  // 3. Collaboration indicators: x, and (using word boundaries)
  const regex = /\s*(?:[,;\/&|]|(?:\bft\b\.?)|(?:\bfeat\b\.?)|(?:\bfeaturing\b)|(?:\bx\b)|(?:\band\b)|(?:\bwith\b))\s*/i;
  
  return artistString
    .split(regex)
    .map(a => a.trim())
    .filter(a => a.length > 0);
}
