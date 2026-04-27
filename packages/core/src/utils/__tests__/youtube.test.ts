import { describe, it, expect } from 'vitest';
import { extractYoutubeId, getCanonicalYoutubeUrl } from '../youtube';

describe('youtube utilities', () => {
  describe('extractYoutubeId', () => {
    it('should extract ID from standard URLs', () => {
      expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYoutubeId('https://youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from short URLs', () => {
      expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ?t=5')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from embed and v URLs', () => {
      expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYoutubeId('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should handle raw IDs', () => {
      expect(extractYoutubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URLs', () => {
      expect(extractYoutubeId('https://google.com')).toBe(null);
      expect(extractYoutubeId('invalid-id')).toBe(null);
      expect(extractYoutubeId('')).toBe(null);
    });
  });

  describe('getCanonicalYoutubeUrl', () => {
    it('should return canonical URL for valid input', () => {
      expect(getCanonicalYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should return null for invalid input', () => {
      expect(getCanonicalYoutubeUrl('not-a-url')).toBe(null);
    });
  });
});
