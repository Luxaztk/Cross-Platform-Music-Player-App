import { describe, it, expect } from 'vitest';
import { canonicalizeArtistCredits, canonicalizeArtists, splitArtists } from '../artists';

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

  it('should split by producer credits without losing either artist', () => {
    expect(splitArtists('HAZELINHO PROD. SUMMERDAYY')).toEqual(['HAZELINHO', 'SUMMERDAYY']);
    expect(splitArtists('Bùi Công Nam Prod. Zenkey')).toEqual(['Bùi Công Nam', 'Zenkey']);
    expect(splitArtists('Bùi Công Nam prod Zenkey')).toEqual(['Bùi Công Nam', 'Zenkey']);
    expect(splitArtists('Đen PROD. by Retro Hills')).toEqual(['Đen', 'Retro Hills']);
    expect(splitArtists('Prod. Zenkey')).toEqual(['Zenkey']);
  });

  it('should unwrap a parenthesized producer credit without leaving punctuation fragments', () => {
    expect(splitArtists('Emcee L x JGKiD x Đen (Prod. by Retro Hills)')).toEqual([
      'Emcee L',
      'JGKiD',
      'Đen',
      'Retro Hills',
    ]);
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

describe('canonicalizeArtists', () => {
  it('should merge confirmed aliases and case-only variants', () => {
    expect(canonicalizeArtists(['BẰNG KIỀU', 'Bằng Kiều'])).toEqual(['Bằng Kiều']);
    expect(canonicalizeArtists(['(S)TRONG Trọng Hiếu', '(S)TRONG'])).toEqual(['(S)TRONG']);
  });

  it('should split a compound value before canonicalizing and de-duplicating it', () => {
    expect(canonicalizeArtists(['Bùi Công Nam, Anh Tú PROD. Zenkey'])).toEqual([
      'Bùi Công Nam',
      'Anh Tú',
      'Zenkey',
    ]);
  });

  it('should not merge similar names without an explicit alias', () => {
    expect(canonicalizeArtists(['Đăng Khôi', 'Đặng Khôi'])).toEqual(['Đăng Khôi', 'Đặng Khôi']);
    expect(canonicalizeArtists(['Phan Đinh Tùng', 'Phan Đình Tùng'])).toEqual([
      'Phan Đinh Tùng',
      'Phan Đình Tùng',
    ]);
  });
});

describe('canonicalizeArtistCredits', () => {
  it('should rebuild artists from the raw credit instead of retaining stale split fragments', () => {
    expect(canonicalizeArtistCredits(
      'Emcee L x JGKiD x Đen (Prod. by Retro Hills)',
      ['Emcee L', 'JGKiD', 'Đen (', 'by Retro Hills)']
    )).toEqual(['Emcee L', 'JGKiD', 'Đen', 'Retro Hills']);
  });

  it('should fall back to the structured artists when the raw credit is empty', () => {
    expect(canonicalizeArtistCredits('', ['Artist A', 'Artist B'])).toEqual([
      'Artist A',
      'Artist B',
    ]);
  });
});
