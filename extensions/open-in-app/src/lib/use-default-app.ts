import { LocalStorage } from "@raycast/api";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "open-in-app:last-app";

type DefaultAppMap = Record<string, string>;

interface DefaultAppHook {
  defaults: DefaultAppMap;
  isLoading: boolean;
  getDefaultApp: (folderPath: string) => string | null;
  setDefaultApp: (folderPath: string, appId: string) => Promise<void>;
  setDefaultIfEmpty: (folderPath: string, appId: string) => Promise<void>;
  removeDefaultApp: (folderPath: string) => Promise<void>;
  updateDefaultApp: (folderPath: string, appId: string) => Promise<void>;
}

export function useDefaultApp(): DefaultAppHook {
  const [defaults, setDefaults] = useState<DefaultAppMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<DefaultAppMap>({});

  useEffect(() => {
    LocalStorage.getItem<string>(STORAGE_KEY).then((raw) => {
      try {
        const parsed = raw ? JSON.parse(raw) : {};
        const migrated: DefaultAppMap = {};
        for (const [path, value] of Object.entries(parsed)) {
          if (typeof value === "string") {
            migrated[path] = value;
          } else if (value && typeof value === "object" && "last" in value) {
            migrated[path] = (value as { last: string }).last;
          }
        }
        mapRef.current = migrated;
        setDefaults(migrated);
      } catch {
        LocalStorage.removeItem(STORAGE_KEY);
      }
      setIsLoading(false);
    });
  }, []);

  async function persist(updated: DefaultAppMap) {
    mapRef.current = updated;
    setDefaults(updated);
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function getDefaultApp(folderPath: string): string | null {
    return mapRef.current[folderPath] ?? null;
  }

  async function setDefaultApp(folderPath: string, appId: string): Promise<void> {
    await persist({ ...mapRef.current, [folderPath]: appId });
  }

  async function setDefaultIfEmpty(folderPath: string, appId: string): Promise<void> {
    if (mapRef.current[folderPath]) return;
    await persist({ ...mapRef.current, [folderPath]: appId });
  }

  async function updateDefaultApp(folderPath: string, appId: string): Promise<void> {
    await persist({ ...mapRef.current, [folderPath]: appId });
  }

  async function removeDefaultApp(folderPath: string): Promise<void> {
    const copy = { ...mapRef.current };
    delete copy[folderPath];
    await persist(copy);
  }

  return { defaults, isLoading, getDefaultApp, setDefaultApp, setDefaultIfEmpty, removeDefaultApp, updateDefaultApp };
}
