import { LocalStorage } from "@raycast/api";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "open-in-app:frecency";
const MAX_ENTRIES = 500;

/** Frequency map: path → open count */
type FreqMap = Record<string, number>;

interface FrecencyHook {
  /** Sort items by open frequency desc, then name asc case-insensitive */
  sortByFrequency: <T extends { path: string; name: string }>(items: T[]) => T[];
  /** Return the open count for the given path (0 if never opened) */
  getFrequency: (path: string) => number;
  /** Record an open event for the given path */
  trackOpen: (path: string) => Promise<void>;
}

export function useFrecency(): FrecencyHook {
  const [, setFreqMap] = useState<FreqMap>({});
  // Use ref so trackOpen closure always has latest map
  const freqRef = useRef<FreqMap>({});

  useEffect(() => {
    (async () => {
      const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
      try {
        const map: FreqMap = raw ? JSON.parse(raw) : {};
        const entries = Object.entries(map);
        if (entries.length > MAX_ENTRIES) {
          const pruned = Object.fromEntries(entries.sort(([, a], [, b]) => b - a).slice(0, MAX_ENTRIES));
          freqRef.current = pruned;
          setFreqMap(pruned);
          await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        } else {
          freqRef.current = map;
          setFreqMap(map);
        }
      } catch {
        // ignore corrupted data
      }
    })();
  }, []);

  async function trackOpen(path: string) {
    const updated = { ...freqRef.current, [path]: (freqRef.current[path] ?? 0) + 1 };
    freqRef.current = updated;
    setFreqMap(updated);
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function sortByFrequency<T extends { path: string; name: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const diff = (freqRef.current[b.path] ?? 0) - (freqRef.current[a.path] ?? 0);
      if (diff !== 0) return diff;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }

  function getFrequency(path: string): number {
    return freqRef.current[path] ?? 0;
  }

  return { sortByFrequency, getFrequency, trackOpen };
}
