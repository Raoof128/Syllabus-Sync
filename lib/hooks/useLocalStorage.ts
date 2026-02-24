// lib/hooks/useLocalStorage.ts
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook to sync state with localStorage.
 * Uses lazy initialization to read from localStorage on first render.
 * Handles SSR gracefully by checking for window availability.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  // Lazy initialization - reads from localStorage on first render only
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      // Silent fail - localStorage may be unavailable or JSON parse error
      return initialValue;
    }
  });

  // Use ref to avoid stale closure in setValue
  const storedValueRef = useRef(storedValue);

  // Update ref when storedValue changes
  useEffect(() => {
    storedValueRef.current = storedValue;
  }, [storedValue]);

  // Return a wrapped version of useState's setter function
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        // Use ref to get current value to avoid stale closure
        const valueToStore = value instanceof Function ? value(storedValueRef.current) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch {
        // Silent fail - localStorage may be unavailable
      }
    },
    [key],
  );

  return [storedValue, setValue];
}
