import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value and track the debouncing state.
 * @param value The value to debounce.
 * @param delay The delay in milliseconds.
 * @returns A tuple containing the debounced value and a boolean indicating if debouncing is in progress.
 */
export function useDebounce<T>(value: T, delay: number): [T, boolean] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false);

  useEffect(() => {
    // If current value is different from original debounced value, start debouncing state
    if (value !== debouncedValue) {
      setIsDebouncing(true);
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return [debouncedValue, isDebouncing];
}
