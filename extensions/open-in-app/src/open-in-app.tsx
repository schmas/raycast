import {
  Action,
  ActionPanel,
  Icon,
  List,
  LocalStorage,
  getApplications,
  getPreferenceValues,
  open,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import ManageApps from "./manage-apps";
import { fuzzySearch } from "./lib/fuzzy-search";
import { useFrecency } from "./lib/use-frecency";
import { useDefaultApp } from "./lib/use-default-app";
import { openInApp } from "./lib/open-in-app";
import { parseAlias } from "./lib/parse-alias";
import { AppConfig, AppConfigHook, useApps } from "./lib/use-apps";
import { FolderItem, useFolders } from "./lib/use-folders";
import { PathsHook, usePaths } from "./lib/use-paths";

const FIGURE_SPACE = "\u2007"; // same width as a digit

function padNum(n: number, width: number): string {
  const s = String(n);
  return FIGURE_SPACE.repeat(Math.max(0, width - s.length)) + s;
}

/** Show parent path (title already shows folder name), truncated to keep last 3 segments */
function parentPath(folder: FolderItem): string {
  const parts = folder.displayPath.split("/");
  parts.pop();
  if (parts.length <= 4) return parts.join("/");
  return "…/" + parts.slice(-3).join("/");
}

function useAppIconResolver() {
  const [pathMap, setPathMap] = useState<Record<string, string>>({});
  useEffect(() => {
    getApplications().then((installed) => {
      const map: Record<string, string> = {};
      for (const a of installed) {
        if (a.bundleId) map[a.bundleId] = a.path;
        map[a.path] = a.path;
      }
      setPathMap(map);
    });
  }, []);
  return (app: AppConfig) => {
    const path = app.appPath || pathMap[app.bundleId];
    return path ? { fileIcon: path } : Icon.AppWindow;
  };
}

function ManageAction({ appsHook, pathsHook }: { appsHook: AppConfigHook; pathsHook: PathsHook }) {
  return (
    <Action.Push
      title="Manage Apps & Paths"
      icon={Icon.Gear}
      target={<ManageApps sharedApps={appsHook} sharedPaths={pathsHook} />}
      shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
    />
  );
}

const SHORTCUT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

function appShortcut(index: number) {
  return index < SHORTCUT_KEYS.length ? { modifiers: ["cmd" as const], key: SHORTCUT_KEYS[index] } : undefined;
}

function appSetDefaultShortcut(index: number) {
  return index < SHORTCUT_KEYS.length
    ? { modifiers: ["cmd" as const, "opt" as const], key: SHORTCUT_KEYS[index] }
    : undefined;
}

const SHOW_FILES_KEY = "open-in-app:show-files";

export default function OpenInApp() {
  const [query, setQuery] = useState("");
  const [showFiles, setShowFiles] = useState(false);
  const pathsHook = usePaths();
  const { paths, isLoading: pathsLoading } = pathsHook;
  const { folders, isLoading: foldersLoading } = useFolders(paths, showFiles);

  useEffect(() => {
    LocalStorage.getItem<string>(SHOW_FILES_KEY).then((val) => {
      if (val === "true") setShowFiles(true);
    });
  }, []);

  async function toggleShowFiles() {
    const next = !showFiles;
    setShowFiles(next);
    await LocalStorage.setItem(SHOW_FILES_KEY, String(next));
  }
  const appsHook = useApps();
  const { apps, isLoading: appsLoading } = appsHook;
  const { defaultTerminal } = getPreferenceValues<Preferences.OpenInApp>();
  const appIcon = useAppIconResolver();
  const { sortByFrequency, getFrequency, trackOpen } = useFrecency();
  const { getDefaultApp, setDefaultApp, setDefaultIfEmpty } = useDefaultApp();

  const isLoading = pathsLoading || foldersLoading || appsLoading;

  const { alias, query: searchTerm } = parseAlias(query);
  const activeApp = alias ? (apps.find((a) => a.alias === alias) ?? null) : null;

  const effectiveSearchTerm = activeApp ? searchTerm : query;

  const frecencyTiebreaker = (item: { path: string }) => getFrequency(item.path);
  const filtered = fuzzySearch(folders, effectiveSearchTerm, "name", frecencyTiebreaker);
  const results = effectiveSearchTerm ? filtered : sortByFrequency(filtered);

  if (!appsLoading && apps.length === 0) {
    return (
      <List>
        <List.Section title="Get Started">
          <List.Item
            title="Choose Default Terminal"
            subtitle={defaultTerminal ? defaultTerminal.name : "Optional — open folders in terminal with ⌘T"}
            icon={defaultTerminal ? { fileIcon: defaultTerminal.path } : Icon.Terminal}
            accessories={defaultTerminal ? [{ text: "✓ Configured" }] : []}
            actions={
              <ActionPanel>
                <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
              </ActionPanel>
            }
          />
          <List.Item
            title="Add Apps & Search Paths"
            subtitle="Configure which apps to use and which folders to search"
            icon={Icon.AppWindow}
            actions={
              <ActionPanel>
                <ManageAction appsHook={appsHook} pathsHook={pathsHook} />
              </ActionPanel>
            }
          />
        </List.Section>
      </List>
    );
  }

  if (!pathsLoading && paths.length === 0) {
    return (
      <List>
        <List.EmptyView
          title="No search paths configured"
          description="Press ⌘⇧M to open Manage Apps & Paths"
          actions={
            <ActionPanel>
              <ManageAction appsHook={appsHook} pathsHook={pathsHook} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      filtering={false}
      isLoading={isLoading}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="Search… | alias: ij react | exact: 'claude"
    >
      {results.map((folder) => {
        const defaultAppId = getDefaultApp(folder.path);
        const defaultApp = defaultAppId ? (apps.find((a) => a.id === defaultAppId) ?? null) : null;

        const visibleApps = activeApp ? [activeApp] : apps;

        return (
          <List.Item
            key={folder.path}
            icon={folder.isDirectory ? Icon.Folder : Icon.Document}
            title={folder.name}
            subtitle={folder.name.length > 35 ? "" : parentPath(folder)}
            keywords={[folder.name]}
            accessories={[
              ...(activeApp ? [{ tag: activeApp.alias }] : []),
              ...(defaultApp
                ? [{ tag: defaultApp.alias.padEnd(4), tooltip: `Default: ${defaultApp.name}` }]
                : [{ text: "      " }]),
              { text: padNum(getFrequency(folder.path), 4), tooltip: "Times opened" },
            ]}
            actions={
              <ActionPanel>
                {/* Open actions — sets default only if none exists */}
                {visibleApps.map((app) => (
                  <Action
                    key={app.id}
                    title={`Open in ${app.name}`}
                    icon={appIcon(app)}
                    shortcut={appShortcut(apps.findIndex((a) => a.id === app.id))}
                    onAction={async () => {
                      try {
                        await trackOpen(folder.path);
                        await setDefaultIfEmpty(folder.path, app.id);
                        await openInApp(folder.path, app);
                      } catch (e) {
                        await showToast({ style: Toast.Style.Failure, title: "Failed to open", message: String(e) });
                      }
                    }}
                  />
                ))}

                {/* Set default & open — always updates default */}
                <ActionPanel.Section title="Set Default & Open">
                  {visibleApps.map((app) => (
                    <Action
                      key={`default-${app.id}`}
                      title={`Default: ${app.name}`}
                      icon={appIcon(app)}
                      shortcut={appSetDefaultShortcut(apps.findIndex((a) => a.id === app.id))}
                      onAction={async () => {
                        try {
                          await trackOpen(folder.path);
                          await setDefaultApp(folder.path, app.id);
                          await openInApp(folder.path, app);
                        } catch (e) {
                          await showToast({ style: Toast.Style.Failure, title: "Failed to open", message: String(e) });
                        }
                      }}
                    />
                  ))}
                </ActionPanel.Section>

                <ActionPanel.Section>
                  {defaultTerminal && (
                    <Action
                      title={`Open in ${defaultTerminal.name}`}
                      icon={defaultTerminal.path ? { fileIcon: defaultTerminal.path } : Icon.Terminal}
                      shortcut={{ modifiers: ["cmd"], key: "t" }}
                      onAction={async () => {
                        try {
                          await trackOpen(folder.path);
                          await open(folder.path, defaultTerminal.bundleId || defaultTerminal.path);
                        } catch (e) {
                          await showToast({ style: Toast.Style.Failure, title: "Failed to open", message: String(e) });
                        }
                      }}
                    />
                  )}
                  <Action.ShowInFinder path={folder.path} shortcut={{ modifiers: ["cmd"], key: "f" }} />
                  <Action.CopyToClipboard
                    title="Copy Path"
                    content={folder.path}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                </ActionPanel.Section>

                <ActionPanel.Section>
                  <Action
                    title={showFiles ? "Show Folders Only" : "Show Files and Folders"}
                    icon={showFiles ? Icon.Folder : Icon.Document}
                    shortcut={{ modifiers: ["cmd"], key: "." }}
                    onAction={toggleShowFiles}
                  />
                  <ManageAction appsHook={appsHook} pathsHook={pathsHook} />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
