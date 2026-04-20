import { LocalStorage } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { randomUUID } from "crypto";
import { useEffect, useState } from "react";

export interface AppConfig {
  id: string;
  alias: string; // e.g. "ij"
  name: string; // e.g. "IntelliJ IDEA"
  bundleId: string; // bundleId or app path used to launch
  appPath?: string; // macOS .app path — used for file icons
}

export interface AppConfigHook {
  apps: AppConfig[];
  isLoading: boolean;
  addApp: (data: Omit<AppConfig, "id">) => Promise<void>;
  updateApp: (app: AppConfig) => Promise<void>;
  deleteApp: (id: string) => Promise<void>;
  moveApp: (id: string, direction: "up" | "down") => Promise<void>;
}

const CACHE_KEY = "apps";
const LEGACY_STORAGE_KEY = "open-in-app:apps";

export function useApps(): AppConfigHook {
  const [apps, setApps] = useCachedState<AppConfig[]>(CACHE_KEY, []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await LocalStorage.getItem<string>(LEGACY_STORAGE_KEY);
      if (raw) {
        try {
          const parsed: AppConfig[] = JSON.parse(raw);
          setApps((current) => (current.length === 0 ? parsed : current));
        } catch {
          /* ignore */
        }
        await LocalStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      setIsLoading(false);
    })();
  }, []);

  async function addApp(data: Omit<AppConfig, "id">) {
    setApps((current) => [...current, { ...data, id: randomUUID() }]);
  }

  async function updateApp(app: AppConfig) {
    setApps((current) => current.map((a) => (a.id === app.id ? app : a)));
  }

  async function deleteApp(id: string) {
    setApps((current) => current.filter((a) => a.id !== id));
  }

  async function moveApp(id: string, direction: "up" | "down") {
    setApps((current) => {
      const idx = current.findIndex((a) => a.id === id);
      if (idx === -1) return current;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= current.length) return current;
      const updated = [...current];
      [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
      return updated;
    });
  }

  return { apps, isLoading, addApp, updateApp, deleteApp, moveApp };
}
