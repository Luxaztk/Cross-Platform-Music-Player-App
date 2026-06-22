import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../../application/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value and false for isDebouncing', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current[0]).toBe('initial');
    expect(result.current[1]).toBe(false);
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Initially, value should not be updated yet, and isDebouncing should be true
    expect(result.current[0]).toBe('initial');
    expect(result.current[1]).toBe(true);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now value should be updated, and isDebouncing should be false
    expect(result.current[0]).toBe('updated');
    expect(result.current[1]).toBe(false);
  });

  it('should cancel previous timer if value changes before delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Update value to 'updated 1'
    rerender({ value: 'updated 1', delay: 500 });
    expect(result.current[0]).toBe('initial');
    expect(result.current[1]).toBe(true);

    // Fast-forward half the delay
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Update value to 'updated 2'
    rerender({ value: 'updated 2', delay: 500 });

    // Fast-forward another 250ms (total 500ms since 'updated 1')
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // The first update should be cancelled, so value is still 'initial'
    expect(result.current[0]).toBe('initial');
    expect(result.current[1]).toBe(true);

    // Fast-forward another 250ms (total 500ms since 'updated 2')
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Now the second update should be applied
    expect(result.current[0]).toBe('updated 2');
    expect(result.current[1]).toBe(false);
  });
});
