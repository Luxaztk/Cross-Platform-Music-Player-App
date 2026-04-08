import { describe, it, expect } from 'vitest';
import { splitArtists } from '../splitArtists';

describe('splitArtists', () => {
  it('should return Unknown Artist for empty or unknown input', () => {
    expect(splitArtists('')).toEqual(['Unknown Artist']);
    expect(splitArtists('Unknown Artist')).toEqual(['Unknown Artist']);
  });

  it('should split by common delimiters', () => {
    expect(splitArtists('Artist A, Artist B')).toEqual(['Artist A', 'Artist B']);
    expect(splitArtists('Artist A; Artist B')).toEqual(['Artist A', 'Artist B']);
    expect(splitArtists('Artist A / Artist B')).toEqual(['Artist A', 'Artist B']);
    expect(splitArtists('Artist A & Artist B')).toEqual(['Artist A', 'Artist B']);
    expect(splitArtists('Artist A | Artist B')).toEqual(['Artist A', 'Artist B']);
  });

  it('should split by "feat" and "ft"', () => {
    expect(splitArtists('Artist A feat. Artist B')).toEqual(['Artist A', 'Artist B']);
    expect(splitArtists('Artist A ft Artist B')).toEqual(['Artist A', 'Artist B']);
    expect(splitArtists('Artist A feat Artist B')).toEqual(['Artist A', 'Artist B']);
    expect(splitArtists('Artist A ft. Artist B')).toEqual(['Artist A', 'Artist B']);
  });

  it('should split by "x", "and", "with"', () => {
    expect(splitArtists('Artist A x Artist B')).toEqual(['Artist A', 'Artist B']);
    expect(splitArtists('Artist A and Artist B')).toEqual(['Artist A', 'Artist B']);
    expect(splitArtists('Artist A with Artist B')).toEqual(['Artist A', 'Artist B']);
  });

  it('should handle multiple delimiters', () => {
    expect(splitArtists('Artist A, Artist B & Artist C feat. Artist D')).toEqual([
      'Artist A',
      'Artist B',
      'Artist C',
      'Artist D'
    ]);
  });

  it('should trim whitespace and filter empty results', () => {
    expect(splitArtists(' Artist A ,  Artist B  ')).toEqual(['Artist A', 'Artist B']);
    expect(splitArtists('Artist A , , Artist B')).toEqual(['Artist A', 'Artist B']);
  });
});
