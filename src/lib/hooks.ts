'use client';

import { useState, useEffect } from 'react';

export function useLocalState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      setState(JSON.parse(stored));
    }
    setLoaded(true);
  }, [key]);

  const setValue = (value: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = value instanceof Function ? value(prev) : value;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  return [state, setValue];
}
