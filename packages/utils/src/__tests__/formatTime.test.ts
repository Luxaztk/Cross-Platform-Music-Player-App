import { describe, it, expect } from 'vitest';
import { formatTime } from '../formatTime';

describe('formatTime', () => {
  it('should format seconds into mm:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(3600)).toBe('60:00');
  });

  it('should handle invalid inputs', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
    // @ts-ignore
    expect(formatTime(null)).toBe('0:00');
    // @ts-ignore
    expect(formatTime(undefined)).toBe('0:00');
  });

  it('should floor the values', () => {
    expect(formatTime(61.9)).toBe('1:01');
  });
});
