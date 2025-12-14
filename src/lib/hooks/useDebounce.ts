import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the value after 'delay' ms
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // If the user types again before the timer ends, clear it!
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}