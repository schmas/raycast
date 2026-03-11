import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { useEffect, useState } from "react";
import { glob } from "glob";

export interface FolderItem {
  name: string; // basename
  path: string; // full absolute path
  displayPath: string; // tilde-shortened for display
}

interface FolderHook {
  folders: FolderItem[];
  isLoading: boolean;
}

const GLOB_CHARS = /[*?[\]{}]/;

/** Directories that are always excluded from scanning */
const IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.hg/**",
  "**/.svn/**",
  "**/dist/**",
  "**/.cache/**",
  "**/__pycache__/**",
];

/** Replace ~ with home directory */
function expandTilde(p: string): string {
  return p.replace(/^~/, os.homedir());
}

/** Shorten path for display by replacing home dir prefix with ~ */
function shortenPath(p: string): string {
  const home = os.homedir();
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

export function useFolders(searchPaths: string[]): FolderHook {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pathsKey = searchPaths.join("|");

  useEffect(() => {
    if (searchPaths.length === 0) {
      setFolders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    async function scan() {
      const allFolders: FolderItem[] = [];

      for (const rawPath of searchPaths) {
        const expanded = expandTilde(rawPath);
        const hasGlob = GLOB_CHARS.test(expanded);

        try {
          // If path contains glob chars, use it directly as the pattern.
          // Otherwise treat as a directory and scan its children.
          const matches = hasGlob
            ? await glob(expanded, { ignore: IGNORE })
            : await glob("*", { cwd: expanded, absolute: true, maxDepth: 1, ignore: IGNORE });

          await Promise.all(
            matches.map(async (match) => {
              try {
                const stat = await fs.promises.stat(match);
                if (stat.isDirectory()) {
                  allFolders.push({
                    name: path.basename(match),
                    path: match,
                    displayPath: shortenPath(match),
                  });
                }
              } catch {
                // skip inaccessible paths
              }
            }),
          );
        } catch {
          // skip invalid patterns
        }
      }

      setFolders(allFolders);
      setIsLoading(false);
    }

    scan();
  }, [pathsKey]);

  return { folders, isLoading };
}
