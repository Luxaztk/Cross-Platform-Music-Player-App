import { describe, it, expect } from 'vitest';
import { YoutubeExtractor } from '../src/extractors/YoutubeExtractor.js';
import { LocalFileExtractor } from '../src/extractors/LocalFileExtractor.js';

describe('Extractors Suite', () => {
  describe('YoutubeExtractor', () => {
    const extractor = new YoutubeExtractor();

    it('validates URLs and queries correctly', () => {
      expect(extractor.validate('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(extractor.validate('rick astley never gonna give you up')).toBe(true);
      expect(extractor.validate('')).toBe(false);
    });
  });

  describe('LocalFileExtractor', () => {
    const extractor = new LocalFileExtractor();

    it('validates supported file extensions when file exists', () => {
      // package.json exists but is not an audio extension
      expect(extractor.validate('./package.json')).toBe(false);
      // Non-existent mp3 file
      expect(extractor.validate('./non_existent_file.mp3')).toBe(false);
    });
  });
});
