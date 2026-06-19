import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { useEffect, useState } from "react";
import { glob } from "glob";
import { PathItem } from "./use-paths";

export interface FolderItem {
  name: string;
  path: string;
  displayPath: string;
  isDirectory: boolean;
}

interface FolderHook {
  folders: FolderItem[];
  isLoading: boolean;
}

const GLOB_CHARS = /[*?[\]{}]/;

// Cap unbounded "**" globs that omit an explicit depth (e.g. "~/dir/**/*") so they
// don't recurse through full repo checkouts and exhaust the worker heap.
const DEFAULT_GLOB_DEPTH = 4;

// Hard ceiling on collected entries. Bounds memory regardless of tree size so a
// single broad search path can never exceed the extension's worker heap limit.
const MAX_RESULTS = 5000;

const IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.hg/**",
  "**/.svn/**",
  "**/dist/**",
  "**/.cache/**",
  "**/__pycache__/**",
];

function expandTilde(p: string): string {
  return p.replace(/^~/, os.homedir());
}

function shortenPath(p: string): string {
  const home = os.homedir();
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

export type FilterMode = "folders" | "files" | "all";

export function useFolders(
  searchPaths: Pick<PathItem, "path" | "maxDepth">[],
  filterMode: FilterMode = "folders",
): FolderHook {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pathsKey = `${searchPaths.map((p) => `${p.path}:${p.maxDepth ?? ""}`).join("|")}:${filterMode}`;

  useEffect(() => {
    if (searchPaths.length === 0) {
      setFolders([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function scan() {
      const allFolders: FolderItem[] = [];

      for (const item of searchPaths) {
        const expanded = expandTilde(item.path);
        const hasGlob = GLOB_CHARS.test(expanded);

        let cwd: string;
        let pattern: string;
        let maxDepth: number | undefined;

        if (hasGlob) {
          const parts = expanded.split("/");
          const firstGlobIdx = parts.findIndex((part) => GLOB_CHARS.test(part));
          cwd = parts.slice(0, firstGlobIdx).join("/") || "/";
          // Skip patterns whose base resolves to filesystem root to avoid scanning the entire disk
          if (cwd === "/") continue;
          pattern = parts.slice(firstGlobIdx).join("/");
          maxDepth = item.maxDepth ?? DEFAULT_GLOB_DEPTH;
        } else {
          cwd = expanded;
          pattern = "*";
          maxDepth = item.maxDepth ?? 1;
        }

        try {
          if (!(await fs.promises.stat(cwd)).isDirectory()) continue;
        } catch {
          continue;
        }

        if (!hasGlob && filterMode !== "files") {
          allFolders.push({ name: path.basename(cwd), path: cwd, displayPath: shortenPath(cwd), isDirectory: true });
        }

        try {
          // Stream matches with their dirent type instead of buffering the full
          // result set and stat'ing every entry — keeps memory flat on huge trees.
          const iterator = glob.iterate(pattern, { cwd, maxDepth, ignore: IGNORE, withFileTypes: true });

          for await (const entry of iterator) {
            if (cancelled) return;
            const isDir = entry.isDirectory();
            const include =
              filterMode === "all" || (filterMode === "folders" && isDir) || (filterMode === "files" && !isDir);
            if (!include) continue;
            const full = entry.fullpath();
            allFolders.push({ name: entry.name, path: full, displayPath: shortenPath(full), isDirectory: isDir });
            if (allFolders.length >= MAX_RESULTS) break;
          }
        } catch {
          // skip invalid patterns
        }

        if (allFolders.length >= MAX_RESULTS) break;
      }

      if (cancelled) return;

      const seen = new Set<string>();
      const unique = allFolders.filter((f) => {
        if (seen.has(f.path)) return false;
        seen.add(f.path);
        return true;
      });
      setFolders(unique);
      setIsLoading(false);
    }

    scan();
    return () => {
      cancelled = true;
    };
  }, [pathsKey]);

  return { folders, isLoading };
}
