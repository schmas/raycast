import { LocalStorage } from "@raycast/api";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "open-in-app:last-app";

type LastAppMap = Record<string, string>;

interface LastAppHook {
  getLastApp: (folderPath: string) => string | null;
  setLastApp: (folderPath: string, appId: string) => void;
}

export function useLastApp(): LastAppHook {
  const [, setMap] = useState<LastAppMap>({});
  const mapRef = useRef<LastAppMap>({});

  useEffect(() => {
    LocalStorage.getItem<string>(STORAGE_KEY).then((raw) => {
      try {
        const parsed = raw ? JSON.parse(raw) : {};
        mapRef.current = parsed;
        setMap(parsed);
      } catch {
        LocalStorage.removeItem(STORAGE_KEY);
      }
    });
  }, []);

  function getLastApp(folderPath: string): string | null {
    return mapRef.current[folderPath] ?? null;
  }

  function setLastApp(folderPath: string, appId: string): void {
    const updated = { ...mapRef.current, [folderPath]: appId };
    mapRef.current = updated;
    LocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return { getLastApp, setLastApp };
}
