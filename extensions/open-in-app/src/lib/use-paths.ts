import { LocalStorage } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { randomUUID } from "crypto";
import { useEffect, useState } from "react";
import * as os from "os";

export interface PathItem {
  id: string;
  path: string; // ~ or absolute, may contain glob chars
  maxDepth?: number;
}

export interface PathsHook {
  paths: PathItem[];
  isLoading: boolean;
  addPath: (path: string, maxDepth?: number) => Promise<void>;
  updatePath: (id: string, newPath: string, maxDepth: number | undefined) => Promise<void>;
  deletePath: (id: string) => Promise<void>;
  movePath: (id: string, direction: "up" | "down") => Promise<void>;
  replacePaths: (items: { path: string; maxDepth?: number }[]) => Promise<void>;
}

const CACHE_KEY = "paths";
const LEGACY_STORAGE_KEY = "open-in-app:paths";

/** Shorten absolute path to ~ form for display */
export function displayPath(p: string): string {
  const home = os.homedir();
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

export function usePaths(): PathsHook {
  const [paths, setPaths] = useCachedState<PathItem[]>(CACHE_KEY, []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await LocalStorage.getItem<string>(LEGACY_STORAGE_KEY);
      if (raw) {
        try {
          const parsed: PathItem[] = JSON.parse(raw);
          setPaths((current) => (current.length === 0 ? parsed : current));
        } catch {
          /* ignore */
        }
        await LocalStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      setIsLoading(false);
    })();
  }, []);

  async function addPath(path: string, maxDepth?: number) {
    const item: PathItem = { id: randomUUID(), path };
    if (maxDepth !== undefined) item.maxDepth = maxDepth;
    setPaths((current) => [...current, item]);
  }

  async function updatePath(id: string, newPath: string, maxDepth: number | undefined) {
    setPaths((current) =>
      current.map((p) => {
        if (p.id !== id) return p;
        const next: PathItem = { ...p, path: newPath };
        if (maxDepth !== undefined) next.maxDepth = maxDepth;
        else delete next.maxDepth;
        return next;
      }),
    );
  }

  async function deletePath(id: string) {
    setPaths((current) => current.filter((p) => p.id !== id));
  }

  async function movePath(id: string, direction: "up" | "down") {
    setPaths((current) => {
      const idx = current.findIndex((p) => p.id === id);
      if (idx === -1) return current;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= current.length) return current;
      const updated = [...current];
      [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
      return updated;
    });
  }

  async function replacePaths(items: { path: string; maxDepth?: number }[]) {
    setPaths((current) => {
      const existingByPath = new Map(current.map((p) => [p.path, p]));
      return items.map(({ path, maxDepth }) => {
        const existing = existingByPath.get(path);
        const next: PathItem = { id: existing?.id ?? randomUUID(), path };
        if (maxDepth !== undefined) next.maxDepth = maxDepth;
        return next;
      });
    });
  }

  return { paths, isLoading, addPath, updatePath, deletePath, movePath, replacePaths };
}
