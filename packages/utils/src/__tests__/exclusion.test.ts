import { describe, it, expect } from 'vitest';
import type { Song, PlaybackContext } from '@music/types';
import {
  buildExclusionIndex,
  isSongExcludedFromDefault,
  shouldPlaySongInContext,
  filterPlayableSongs,
} from '../exclusion';

describe('Playback Exclusion Utilities (v4)', () => {
  const normalSong: Song = {
    id: 's1',
    filePath: 'C:/music/track1.mp3',
    title: 'Normal Song',
    artist: 'Artist A',
    artists: ['Artist A'],
    album: 'Great Album',
    duration: 180,
    genre: 'Pop',
    year: 2024,
    coverArt: null,
  };

  const sleepSong: Song = {
    id: 's2',
    filePath: 'C:/music/sleep.mp3',
    title: 'Sleep Ambience',
    artist: 'Ambient Artist',
    artists: ['Ambient Artist'],
    album: 'Sleep Sounds',
    duration: 3600,
    genre: 'Ambient',
    year: 2024,
    coverArt: null,
  };

  const flaggedSong: Song = {
    id: 's3',
    filePath: 'C:/music/skit.mp3',
    title: 'Funny Skit',
    artist: 'Artist A',
    artists: ['Artist A'],
    album: 'Great Album',
    duration: 30,
    genre: 'Comedy',
    year: 2024,
    coverArt: null,
    excludeFromDefault: true,
  };

  const settings = {
    excludedSongIds: ['s-custom'],
    excludedAlbums: ['Sleep Sounds', 'Christmas Special'],
    excludedPlaylists: ['p-sleep'],
  };

  const index = buildExclusionIndex(settings);

  describe('buildExclusionIndex', () => {
    it('creates lookup sets and normalizes album strings to lowercase', () => {
      expect(index.songIds.has('s-custom')).toBe(true);
      expect(index.albums.has('sleep sounds')).toBe(true);
      expect(index.albums.has('christmas special')).toBe(true);
      expect(index.playlists.has('p-sleep')).toBe(true);
      expect(index.albums.has('great album')).toBe(false);
    });
  });

  describe('isSongExcludedFromDefault', () => {
    it('returns true if song has excludeFromDefault flag set', () => {
      expect(isSongExcludedFromDefault(flaggedSong, index)).toBe(true);
    });

    it('returns true if song ID is in the exclusion settings', () => {
      const customSong: Song = { ...normalSong, id: 's-custom' };
      expect(isSongExcludedFromDefault(customSong, index)).toBe(true);
    });

    it('returns true if song album matches excluded albums (case-insensitive)', () => {
      expect(isSongExcludedFromDefault(sleepSong, index)).toBe(true);
      const mixedCaseAlbumSong: Song = { ...normalSong, album: 'sLeEp SoUnDs  ' };
      expect(isSongExcludedFromDefault(mixedCaseAlbumSong, index)).toBe(true);
    });

    it('returns false for regular songs not matching any exclusion criteria', () => {
      expect(isSongExcludedFromDefault(normalSong, index)).toBe(false);
    });
  });

  describe('shouldPlaySongInContext', () => {
    it('allows playing ALL songs (even excluded ones) when context is explicit', () => {
      const explicitContext: PlaybackContext = {
        type: 'album',
        id: 'Sleep Sounds',
        isExplicit: true,
      };

      expect(shouldPlaySongInContext(sleepSong, explicitContext, index)).toBe(true);
      expect(shouldPlaySongInContext(flaggedSong, explicitContext, index)).toBe(true);
      expect(shouldPlaySongInContext(normalSong, explicitContext, index)).toBe(true);
    });

    it('allows playing any song when context is direct click', () => {
      const directContext: PlaybackContext = {
        type: 'direct',
        isExplicit: false,
      };
      expect(shouldPlaySongInContext(sleepSong, directContext, index)).toBe(true);
      expect(shouldPlaySongInContext(flaggedSong, directContext, index)).toBe(true);
    });

    it('excludes songs from general library playback when context is not explicit', () => {
      const libraryContext: PlaybackContext = {
        type: 'library',
        isExplicit: false,
      };

      expect(shouldPlaySongInContext(normalSong, libraryContext, index)).toBe(true);
      expect(shouldPlaySongInContext(sleepSong, libraryContext, index)).toBe(false);
      expect(shouldPlaySongInContext(flaggedSong, libraryContext, index)).toBe(false);
    });

    it('excludes songs if playlist itself is excluded in general playback', () => {
      const playlistContext: PlaybackContext = {
        type: 'playlist',
        id: 'p-sleep',
        isExplicit: false,
      };

      expect(shouldPlaySongInContext(normalSong, playlistContext, index)).toBe(false);
    });
  });

  describe('filterPlayableSongs', () => {
    const songList: Song[] = [normalSong, sleepSong, flaggedSong];

    it('retains 100% of songs when context is explicit (e.g. playing from specific album)', () => {
      const explicitContext: PlaybackContext = {
        type: 'album',
        id: 'Sleep Sounds',
        isExplicit: true,
      };
      const result = filterPlayableSongs(songList, explicitContext, index);
      expect(result).toHaveLength(3);
    });

    it('filters out excluded songs when playing general library', () => {
      const libraryContext: PlaybackContext = {
        type: 'library',
        isExplicit: false,
      };
      const result = filterPlayableSongs(songList, libraryContext, index);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });
  });
});
