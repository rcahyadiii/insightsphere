import { useEffect, useState } from "react";

/**
 * Debounces a value change. The returned value only updates after `delay` ms
 * have passed since the last change to the input value.
 *
 * Useful for search inputs, window resize handlers, and anywhere you want
 * to throttle expensive effects (filtering, API calls) based on fast-changing
 * state.
 *
 * @example
 *   const [query, setQuery] = useState("");
 *   const debouncedQuery = useDebounce(query, 300);
 *
 *   useEffect(() => {
 *     if (debouncedQuery) fetchResults(debouncedQuery);
 *   }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
