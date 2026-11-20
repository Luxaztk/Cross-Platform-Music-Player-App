/**
 * Comprehensive regex for multiple artist delimiters
 * 1. Common separators: , ; / & |
 * 2. Credit variants: ft, feat, featuring, prod, with (handles optional dot)
 * 3. Collaboration indicators: x, and (using word boundaries)
 */
export const ARTIST_SEPARATOR_REGEX = /\s*(?:[,;/&|]|(?:\bft\b\.?)|(?:\bfeat\b\.?)|(?:\bfeaturing\b)|(?:\bprod\b\.?(?:\s+\bby\b)?)|(?:\bx\b)|(?:\band\b)|(?:\bwith\b))\s*/i;

const PARENTHESIZED_PRODUCER_CREDIT_REGEX = /\(\s*\bprod\b\.?\s*(?:\bby\b\s*)?([^)]*?)\s*\)/gi;

const normalizeWhitespace = (value: string): string => value
  .normalize('NFC')
  .trim()
  .replace(/\s+/g, ' ');

export const normalizeArtistIdentityKey = (value: string): string => normalizeWhitespace(value)
  .toLocaleLowerCase();

const CANONICAL_ARTIST_NAMES: Readonly<Record<string, string>> = {
  'bằng kiều': 'Bằng Kiều',
  '(s)trong': '(S)TRONG',
  '(s)trong trọng hiếu': '(S)TRONG',
  'cậu phát': 'Cậu Phát',
  'ccmk': 'CCMK',
  'double2t': 'Double2T',
  'đạt g': 'Đạt G',
  'đen': 'Đen',
  'kiên ứng': 'Kiên Ứng',
  'zenkey': 'Zenkey',
};

export function splitArtists(artistString: string): string[] {
  if (!artistString || artistString === 'Unknown Artist') return ['Unknown Artist'];

  const normalizedCredits = artistString.replace(
    PARENTHESIZED_PRODUCER_CREDIT_REGEX,
    (_credit, producer: string) => ` prod. ${producer}`
  );

  return normalizedCredits
    .split(ARTIST_SEPARATOR_REGEX)
    .map(a => a.trim())
    .filter(a => a.length > 0);
}

export function canonicalizeArtistName(artistName: string): string {
  const normalizedName = normalizeWhitespace(artistName);
  return CANONICAL_ARTIST_NAMES[normalizeArtistIdentityKey(normalizedName)] ?? normalizedName;
}

export function canonicalizeArtists(artistValues: readonly string[]): string[] {
  const canonicalArtists: string[] = [];
  const seen = new Set<string>();

  artistValues.forEach((rawValue) => {
    if (!rawValue.trim()) return;

    splitArtists(rawValue).forEach((artistName) => {
      const canonicalName = canonicalizeArtistName(artistName);
      const identityKey = normalizeArtistIdentityKey(canonicalName);
      if (!identityKey || seen.has(identityKey)) return;

      seen.add(identityKey);
      canonicalArtists.push(canonicalName);
    });
  });

  return canonicalArtists;
}

export function canonicalizeArtistCredits(
  rawArtist: string | undefined,
  fallbackArtists: readonly string[] = []
): string[] {
  return canonicalizeArtists(rawArtist?.trim() ? [rawArtist] : fallbackArtists);
}
