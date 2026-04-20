import { LocalStorage } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { useEffect, useState } from "react";

const CACHE_KEY = "default-apps";
const LEGACY_STORAGE_KEY = "open-in-app:last-app";

type DefaultAppMap = Record<string, string>;

interface DefaultAppHook {
  defaults: DefaultAppMap;
  isLoading: boolean;
  getDefaultApp: (folderPath: string) => string | null;
  setDefaultApp: (folderPath: string, appId: string) => Promise<void>;
  setDefaultIfEmpty: (folderPath: string, appId: string) => Promise<void>;
  removeDefaultApp: (folderPath: string) => Promise<void>;
}

export function useDefaultApp(): DefaultAppHook {
  const [defaults, setDefaults] = useCachedState<DefaultAppMap>(CACHE_KEY, {});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await LocalStorage.getItem<string>(LEGACY_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const migrated: DefaultAppMap = {};
          for (const [path, value] of Object.entries(parsed)) {
            if (typeof value === "string") {
              migrated[path] = value;
            } else if (value && typeof value === "object" && "last" in value) {
              migrated[path] = (value as { last: string }).last;
            }
          }
          setDefaults((current) => (Object.keys(current).length === 0 ? migrated : current));
        } catch {
          /* ignore */
        }
        await LocalStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      setIsLoading(false);
    })();
  }, []);

  function getDefaultApp(folderPath: string): string | null {
    return defaults[folderPath] ?? null;
  }

  async function setDefaultApp(folderPath: string, appId: string) {
    setDefaults((current) => ({ ...current, [folderPath]: appId }));
  }

  async function setDefaultIfEmpty(folderPath: string, appId: string) {
    setDefaults((current) => (current[folderPath] ? current : { ...current, [folderPath]: appId }));
  }

  async function removeDefaultApp(folderPath: string) {
    setDefaults((current) => {
      if (!(folderPath in current)) return current;
      const copy = { ...current };
      delete copy[folderPath];
      return copy;
    });
  }

  return { defaults, isLoading, getDefaultApp, setDefaultApp, setDefaultIfEmpty, removeDefaultApp };
}
