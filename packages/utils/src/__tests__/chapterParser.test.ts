import { describe, it, expect } from 'vitest';
import {
  parseTimestampToSeconds,
  parseChaptersFromText,
  normalizeYtDlpChapters,
  extractSongChapters,
} from '../chapterParser';

describe('chapterParser', () => {
  describe('parseTimestampToSeconds', () => {
    it('parses MM:SS format correctly', () => {
      expect(parseTimestampToSeconds('0:00')).toBe(0);
      expect(parseTimestampToSeconds('03:45')).toBe(225);
      expect(parseTimestampToSeconds('59:59')).toBe(3599);
    });

    it('parses HH:MM:SS format correctly', () => {
      expect(parseTimestampToSeconds('01:00:00')).toBe(3600);
      expect(parseTimestampToSeconds('1:20:15')).toBe(4815);
      expect(parseTimestampToSeconds('02:35:40')).toBe(9340);
    });

    it('returns 0 for invalid inputs', () => {
      expect(parseTimestampToSeconds('')).toBe(0);
      expect(parseTimestampToSeconds('invalid:time')).toBe(0);
      expect(parseTimestampToSeconds('abc')).toBe(0);
    });
  });

  describe('parseChaptersFromText', () => {
    it('parses typical YouTube description timestamps', () => {
      const desc = `
Tracklist:
00:00 Intro
02:15 The Weeknd - Starboy
06:30 Daft Punk - Get Lucky
10:45 Post Malone - Circles
      `;

      const chapters = parseChaptersFromText(desc, 900);
      expect(chapters).toHaveLength(4);

      expect(chapters[0]).toEqual({
        id: 'ch-0',
        title: 'Intro',
        startTime: 0,
        endTime: 135,
        artist: undefined,
      });

      expect(chapters[1]).toEqual({
        id: 'ch-1',
        title: 'Starboy',
        startTime: 135,
        endTime: 390,
        artist: 'The Weeknd',
      });

      expect(chapters[2]).toEqual({
        id: 'ch-2',
        title: 'Get Lucky',
        startTime: 390,
        endTime: 645,
        artist: 'Daft Punk',
      });

      expect(chapters[3]).toEqual({
        id: 'ch-3',
        title: 'Circles',
        startTime: 645,
        endTime: 900,
        artist: 'Post Malone',
      });
    });

    it('parses bracketed and numbered formats', () => {
      const desc = `
[00:00] 1. First Track
[03:45] 2. Second Track - Chill Artist
(01:15:30) 3. Long Mix Finale
      `;

      const chapters = parseChaptersFromText(desc);
      expect(chapters).toHaveLength(3);

      expect(chapters[0].startTime).toBe(0);
      expect(chapters[0].title).toBe('First Track');
      expect(chapters[0].endTime).toBe(225);

      expect(chapters[1].startTime).toBe(225);
      expect(chapters[1].title).toBe('Chill Artist');
      expect(chapters[1].artist).toBe('Second Track');
      expect(chapters[1].endTime).toBe(4530);

      expect(chapters[2].startTime).toBe(4530);
      expect(chapters[2].title).toBe('Long Mix Finale');
      expect(chapters[2].endTime).toBeUndefined();
    });

    it('sorts and deduplicates timestamps out of order', () => {
      const desc = `
05:00 Track 2
00:00 Track 1
05:00 Duplicate Track 2
10:00 Track 3
      `;

      const chapters = parseChaptersFromText(desc);
      expect(chapters).toHaveLength(3);
      expect(chapters[0].startTime).toBe(0);
      expect(chapters[1].startTime).toBe(300);
      expect(chapters[2].startTime).toBe(600);
    });

    it('returns empty array when no timestamps found', () => {
      expect(parseChaptersFromText('Just a normal video description with no timestamps.')).toEqual([]);
      expect(parseChaptersFromText('')).toEqual([]);
    });
  });

  describe('normalizeYtDlpChapters', () => {
    it('converts raw yt-dlp chapters accurately', () => {
      const raw = [
        { start_time: 0, end_time: 150, title: 'Intro & Welcome' },
        { start_time: 150, end_time: 320, title: 'Alan Walker - Faded' },
      ];

      const chapters = normalizeYtDlpChapters(raw, 500);
      expect(chapters).toHaveLength(2);

      expect(chapters[0]).toEqual({
        id: 'ch-0',
        title: 'Intro & Welcome',
        startTime: 0,
        endTime: 150,
        artist: undefined,
      });

      expect(chapters[1]).toEqual({
        id: 'ch-1',
        title: 'Faded',
        startTime: 150,
        endTime: 320,
        artist: 'Alan Walker',
      });
    });
  });

  describe('extractSongChapters', () => {
    it('prefers rawChapters when available', () => {
      const raw = [{ start_time: 0, title: 'Native Chapter 1' }];
      const desc = '00:00 Description Chapter';

      const chapters = extractSongChapters({ rawChapters: raw, description: desc });
      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe('Native Chapter 1');
    });

    it('falls back to description when rawChapters is empty', () => {
      const desc = '00:00 Desc Chapter 1\n03:00 Desc Chapter 2';
      const chapters = extractSongChapters({ rawChapters: [], description: desc });
      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Desc Chapter 1');
    });

    it('returns empty array when neither exists', () => {
      expect(extractSongChapters({})).toEqual([]);
    });
  });
});
