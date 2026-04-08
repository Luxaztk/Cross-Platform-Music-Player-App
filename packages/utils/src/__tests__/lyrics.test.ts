import { describe, it, expect } from 'vitest';
import { cleanLyricsTitle, getPrimaryArtist, formatLyricsSearchQuery, normalizeNFC } from '../lyrics';

describe('Lyrics Utils', () => {
  describe('normalizeNFC', () => {
    it('should normalize Vietnamese characters to NFC', () => {
      // Testing combined characters (Dấu tiếng Việt)
      // "â" in decomposed (a + ˆ) vs composed
      const decomposed = 'a\u0302'; 
      const normalized = normalizeNFC(decomposed);
      expect(normalized).toBe('â');
      expect(normalized.length).toBe(1);
    });

    it('should trim whitespace', () => {
      expect(normalizeNFC('  Hello World  ')).toBe('Hello World');
    });
  });

  describe('cleanLyricsTitle', () => {
    it('should remove Official MV and other suffixes', () => {
      expect(cleanLyricsTitle('Sơn Tùng M-TP | CHÚNG TA CỦA TƯƠNG LAI | Official MV')).toContain('CHÚNG TA CỦA TƯƠNG LAI');
      expect(cleanLyricsTitle('Nhạc Của Rừng (Official Music Video)')).toBe('Nhạc Của Rừng');
      expect(cleanLyricsTitle('Song Title [Lyrics Video]')).toBe('Song Title');
      expect(cleanLyricsTitle('Song Title (Live)')).toBe('Song Title');
      expect(cleanLyricsTitle('Song Title (Cover)')).toBe('Song Title');
    });

    it('should replace feat. and ft. with &', () => {
      expect(cleanLyricsTitle('Song feat. Artist')).toBe('Song & Artist');
      expect(cleanLyricsTitle('Song ft Artist')).toBe('Song & Artist');
    });

    it('should keep core title intact', () => {
      expect(cleanLyricsTitle('Nhạc của rừng')).toBe('Nhạc của rừng');
    });
  });

  describe('getPrimaryArtist', () => {
    it('should extract the first artist before delimiters', () => {
      expect(getPrimaryArtist('Đen, Hiền Thục')).toBe('Đen');
      expect(getPrimaryArtist('Sơn Tùng M-TP ft. Hải Tú')).toBe('Sơn Tùng M-TP');
      expect(getPrimaryArtist('Artist A & Artist B')).toBe('Artist A');
    });

    it('should return empty string for Unknown artists', () => {
      expect(getPrimaryArtist('Unknown Artist')).toBe('');
      expect(getPrimaryArtist(undefined)).toBe('');
      expect(getPrimaryArtist('')).toBe('');
    });
  });

  describe('formatLyricsSearchQuery', () => {
    it('should combine title and primary artist', () => {
      expect(formatLyricsSearchQuery('Nhạc của rừng', 'Đen')).toBe('Nhạc của rừng - Đen');
    });

    it('should handle missing artist', () => {
      expect(formatLyricsSearchQuery('Nhạc của rừng', 'Unknown')).toBe('Nhạc của rừng');
      expect(formatLyricsSearchQuery('Song name', undefined)).toBe('Song name');
    });

    it('should clean title before formatting', () => {
      expect(formatLyricsSearchQuery('Song Title (Official MV)', 'Artist')).toBe('Song Title - Artist');
    });
  });
});
