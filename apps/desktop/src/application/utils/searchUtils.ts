import type { Song } from '@music/types';

/**
 * Normalizes text for searching by performing the following operations:
 * 1. Lowercase conversion.
 * 2. Replacing Vietnamese "đ" with "d".
 * 3. Unicode NFD normalization to separate diacritics.
 * 4. Removing all diacritics using regex.
 * 5. Trimming leading and trailing whitespace.
 */
export const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Checks if a piece of text matches a query string using Smart Intent Detection.
 */
export const textMatches = (text: string | null | undefined, query: string | null | undefined): boolean => {
  const cleanQuery = query?.trim().toLowerCase() || '';
  const cleanText = text?.trim().toLowerCase() || '';
  
  if (!cleanQuery) return true;
  if (!cleanText) return false;

  const normalizedQuery = normalizeText(cleanQuery);
  const normalizedText = normalizeText(cleanText);

  // SMART INTENT DETECTION
  // Nếu query gốc khác query đã cào bằng => User CÓ gõ dấu hoặc ký tự đặc biệt (đ)
  if (cleanQuery !== normalizedQuery) {
    // Bắt buộc text gốc (đã lowercase) phải chứa chính xác cụm từ có dấu đó
    return cleanText.includes(cleanQuery);
  }

  // Fallback: User gõ không dấu -> Cào bằng tìm kiếm mờ trên bản đã normalize
  return normalizedText.includes(normalizedQuery);
};

export interface ClusteredSongs {
  titles: Song[];
  artists: Song[];
  albums: Song[];
}

/**
 * Groups songs into three categories based on match priority: Title > Artist > Album.
 * Each group is sorted alphabetically using Vietnamese locale.
 */
export const groupAndSortSongs = (songs: Song[], query: string): ClusteredSongs => {
  const titles: Song[] = [];
  const artists: Song[] = [];
  const albums: Song[] = [];

  songs.forEach((song) => {
    const songTitle = (song as any).title || (song as any).name;
    
    if (textMatches(songTitle, query)) {
      titles.push(song);
    } else if (
      (song.artists && song.artists.some((a) => textMatches(a, query))) ||
      textMatches(song.artist, query)
    ) {
      artists.push(song);
    } else if (textMatches(song.album, query)) {
      albums.push(song);
    }
  });

  const sortFn = (key: keyof Song) => (a: Song, b: Song) => {
    // Đặc biệt xử lý cho tiêu đề vì có thể là .title hoặc .name
    const valA = key === 'title' 
      ? ((a as any).title || (a as any).name || '') 
      : ((a[key] as string) || '');
      
    const valB = key === 'title' 
      ? ((b as any).title || (b as any).name || '') 
      : ((b[key] as string) || '');

    return valA.localeCompare(valB, 'vi');
  };

  return {
    titles: titles.sort(sortFn('title')),
    artists: artists.sort(sortFn('artist')),
    albums: albums.sort(sortFn('album')),
  };
};
