import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value and track the debouncing state.
 * @param value The value to debounce.
 * @param delay The delay in milliseconds.
 * @returns A tuple containing the debounced value and a boolean indicating if debouncing is in progress.
 */
export function useDebounce<T>(value: T, delay: number): [T, boolean] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return [debouncedValue, value !== debouncedValue];
}
