import {
  Action,
  ActionPanel,
  Alert,
  Application,
  Color,
  Form,
  Icon,
  List,
  Toast,
  confirmAlert,
  getApplications,
  getPreferenceValues,
  openExtensionPreferences,
  showToast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { AppConfig, useApps } from "./lib/use-apps";
import { PathItem, displayPath, usePaths } from "./lib/use-paths";
import { useDefaultApp } from "./lib/use-default-app";
import { useFrecency } from "./lib/use-frecency";

export default function ManageApps() {
  const { apps, isLoading: appsLoading, addApp, updateApp, deleteApp, moveApp } = useApps();
  const { paths, isLoading: pathsLoading, addPath, updatePath, deletePath, movePath, replacePaths } = usePaths();
  const { defaultTerminal } = getPreferenceValues<Preferences.ManageApps>();
  const { defaults, isLoading: defaultsLoading, removeDefaultApp, setDefaultApp } = useDefaultApp();
  const { getFrequency } = useFrecency();

  async function handleDeleteApp(app: AppConfig) {
    const confirmed = await confirmAlert({
      title: `Delete "${app.name}"?`,
      message: "This action cannot be undone.",
      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
    });
    if (confirmed) await deleteApp(app.id);
  }

  async function handleDeletePath(item: PathItem) {
    const confirmed = await confirmAlert({
      title: `Remove "${displayPath(item.path)}"?`,
      primaryAction: { title: "Remove", style: Alert.ActionStyle.Destructive },
    });
    if (confirmed) await deletePath(item.id);
  }

  async function handleDeleteDefault(folderPath: string) {
    const confirmed = await confirmAlert({
      title: `Remove default for "${displayPath(folderPath)}"?`,
      primaryAction: { title: "Remove", style: Alert.ActionStyle.Destructive },
    });
    if (confirmed) await removeDefaultApp(folderPath);
  }

  const defaultEntries = Object.entries(defaults)
    .map(([folderPath, appId]) => ({
      folderPath,
      appId,
      app: apps.find((a) => a.id === appId),
      frequency: getFrequency(folderPath),
    }))
    .sort((a, b) => b.frequency - a.frequency);

  return (
    <List isLoading={appsLoading || pathsLoading || defaultsLoading}>
      {/* Terminal section */}
      <List.Section title="Terminal">
        <List.Item
          title="Default Terminal"
          subtitle={defaultTerminal ? defaultTerminal.name : "Not configured"}
          icon={defaultTerminal?.path ? { fileIcon: defaultTerminal.path } : Icon.Terminal}
          actions={
            <ActionPanel>
              <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      </List.Section>

      {/* Apps section */}
      <List.Section title="Apps">
        {apps.map((app) => (
          <List.Item
            key={app.id}
            icon={app.appPath ? { fileIcon: app.appPath } : Icon.AppWindow}
            title={app.name}
            subtitle={`alias: ${app.alias}`}
            accessories={[{ text: app.bundleId }]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Edit"
                  target={<AppForm app={app} onSave={(v) => updateApp({ ...app, ...v })} existingApps={apps} />}
                />
                <Action
                  title="Move up"
                  icon={Icon.ArrowUp}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "arrowUp" }}
                  onAction={() => moveApp(app.id, "up")}
                />
                <Action
                  title="Move Down"
                  icon={Icon.ArrowDown}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "arrowDown" }}
                  onAction={() => moveApp(app.id, "down")}
                />
                <Action title="Delete" style={Action.Style.Destructive} onAction={() => handleDeleteApp(app)} />
              </ActionPanel>
            }
          />
        ))}
        <List.Item
          title="Add App"
          icon={Icon.Plus}
          actions={
            <ActionPanel>
              <Action.Push title="Add App" target={<AppForm onSave={addApp} existingApps={apps} />} />
            </ActionPanel>
          }
        />
      </List.Section>

      {/* Search Paths section */}
      <List.Section title="Search Paths">
        {paths.map((item) => (
          <List.Item
            key={item.id}
            icon={Icon.Folder}
            title={displayPath(item.path)}
            subtitle={item.path}
            accessories={[
              ...(item.maxDepth !== undefined ? [{ text: `depth: ${item.maxDepth}` }] : []),
              ...(item.defaultAppId
                ? apps.some((a) => a.id === item.defaultAppId)
                  ? [
                      {
                        tag: `@${apps.find((a) => a.id === item.defaultAppId)!.alias}`,
                        tooltip: `Default: ${apps.find((a) => a.id === item.defaultAppId)!.name}`,
                      },
                    ]
                  : [{ tag: { value: "@missing", color: Color.Red }, tooltip: "The referenced app has been deleted" }]
                : []),
            ]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Edit"
                  icon={Icon.Pencil}
                  target={<PathForm item={item} apps={apps} onSave={(p, d, a) => updatePath(item.id, p, d, a)} />}
                />
                <Action
                  title="Move up"
                  icon={Icon.ArrowUp}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "arrowUp" }}
                  onAction={() => movePath(item.id, "up")}
                />
                <Action
                  title="Move Down"
                  icon={Icon.ArrowDown}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "arrowDown" }}
                  onAction={() => movePath(item.id, "down")}
                />
                <Action
                  title="Remove"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={() => handleDeletePath(item)}
                />
              </ActionPanel>
            }
          />
        ))}
        <List.Item
          title="Edit All Paths"
          subtitle="Bulk edit — one path per line"
          icon={Icon.TextCursor}
          actions={
            <ActionPanel>
              <Action.Push
                title="Edit All Paths"
                target={<PathsBulkForm paths={paths} apps={apps} onSave={replacePaths} />}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Add Search Path"
          icon={Icon.Plus}
          actions={
            <ActionPanel>
              <Action.Push
                title="Add Search Path"
                target={<PathForm apps={apps} onSave={(p, d, a) => addPath(p, d, a)} />}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      {/* Folder Defaults section */}
      {defaultEntries.length > 0 && (
        <List.Section title="Folder Defaults" subtitle={`${defaultEntries.length} folders`}>
          {defaultEntries.map(({ folderPath, app, frequency }) => (
            <List.Item
              key={folderPath}
              icon={app?.appPath ? { fileIcon: app.appPath } : Icon.AppWindow}
              title={displayPath(folderPath)}
              subtitle={app?.name ?? "Unknown app"}
              accessories={[...(frequency > 0 ? [{ text: `${frequency}×`, tooltip: "Times opened" }] : [])]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="Change Default App"
                    icon={Icon.Pencil}
                    target={
                      <DefaultAppForm
                        folderPath={folderPath}
                        currentAppId={app?.id}
                        apps={apps}
                        onSave={setDefaultApp}
                      />
                    }
                  />
                  <Action
                    title="Remove Default"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    onAction={() => handleDeleteDefault(folderPath)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

// --- Default App Form ---

function DefaultAppForm({
  folderPath,
  currentAppId,
  apps,
  onSave,
}: {
  folderPath: string;
  currentAppId?: string;
  apps: AppConfig[];
  onSave: (folderPath: string, appId: string) => Promise<void>;
}) {
  const { pop } = useNavigation();

  async function handleSubmit(values: { appId: string }) {
    if (!values.appId) {
      await showToast({ style: Toast.Style.Failure, title: "Please select an application" });
      return;
    }
    await onSave(folderPath, values.appId);
    pop();
  }

  return (
    <Form
      navigationTitle={`Default for ${displayPath(folderPath)}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description title="Folder" text={displayPath(folderPath)} />
      <Form.Dropdown id="appId" title="Default App" defaultValue={currentAppId}>
        {apps.map((a) => (
          <Form.Dropdown.Item
            key={a.id}
            value={a.id}
            title={a.name}
            icon={a.appPath ? { fileIcon: a.appPath } : Icon.AppWindow}
          />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

// --- App Form ---

interface AppFormValues {
  alias: string;
  appId: string;
}

function AppForm({
  app,
  onSave,
  existingApps,
}: {
  app?: AppConfig;
  onSave: (data: Omit<AppConfig, "id">) => Promise<void>;
  existingApps: AppConfig[];
}) {
  const { pop } = useNavigation();
  const [installedApps, setInstalledApps] = useState<Application[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  useEffect(() => {
    getApplications()
      .then((apps) => setInstalledApps(apps.sort((a, b) => a.name.localeCompare(b.name))))
      .finally(() => setIsLoadingApps(false));
  }, []);

  async function handleSubmit(values: AppFormValues) {
    const alias = values.alias.trim();
    if (!alias) {
      await showToast({ style: Toast.Style.Failure, title: "Alias is required" });
      return;
    }
    if (alias.includes(" ")) {
      await showToast({ style: Toast.Style.Failure, title: "Alias cannot contain spaces" });
      return;
    }
    if (!values.appId) {
      await showToast({ style: Toast.Style.Failure, title: "Please select an application" });
      return;
    }
    const duplicate = existingApps.find((a) => a.alias === alias && a.id !== app?.id);
    if (duplicate) {
      await showToast({ style: Toast.Style.Failure, title: `Alias "${alias}" is already used by ${duplicate.name}` });
      return;
    }
    const selected = installedApps.find((a) => (a.bundleId || a.path) === values.appId);
    if (!selected) return;
    await onSave({ alias, name: selected.name, bundleId: values.appId, appPath: selected.path });
    pop();
  }

  return (
    <Form
      navigationTitle={app ? "Edit App" : "Add App"}
      isLoading={isLoadingApps}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={app ? "Save Changes" : "Add App"} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="alias"
        title="Alias"
        placeholder="ij"
        defaultValue={app?.alias}
        info="Short prefix used to target this app (e.g. 'ij react')"
      />
      <Form.Dropdown id="appId" title="Application" defaultValue={app?.bundleId}>
        {installedApps.map((a) => (
          <Form.Dropdown.Item
            key={a.bundleId || a.path}
            value={a.bundleId || a.path}
            title={a.name}
            icon={{ fileIcon: a.path }}
          />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

// --- Paths Bulk Form ---

function PathsBulkForm({
  paths,
  apps,
  onSave,
}: {
  paths: PathItem[];
  apps: AppConfig[];
  onSave: (items: { path: string; maxDepth?: number; defaultAppId?: string }[]) => Promise<void>;
}) {
  const { pop } = useNavigation();

  function aliasFor(appId: string | undefined): string | undefined {
    if (!appId) return undefined;
    return apps.find((a) => a.id === appId)?.alias;
  }

  function serialize(items: PathItem[]): string {
    return items
      .map((p) => {
        let line = p.path;
        if (p.maxDepth !== undefined) line += `,${p.maxDepth}`;
        const alias = aliasFor(p.defaultAppId);
        if (alias) line += ` @${alias}`;
        return line;
      })
      .join("\n");
  }

  /**
   * Parse a single bulk-editor line. Recognised shapes:
   *   path
   *   path,depth
   *   path @alias
   *   path,depth @alias
   * Alias may appear before or after the (path,depth) run in any whitespace-separated position.
   */
  function parseLine(
    line: string,
  ): { ok: true; value: { path: string; maxDepth?: number; defaultAppId?: string } } | { ok: false; error: string } {
    const aliasMatch = line.match(/\s@(\S+)/);
    let alias: string | undefined;
    let head = line;
    if (aliasMatch) {
      alias = aliasMatch[1];
      head = (line.slice(0, aliasMatch.index) + line.slice((aliasMatch.index ?? 0) + aliasMatch[0].length)).trim();
    } else {
      head = line.trim();
    }

    let path = head;
    let maxDepth: number | undefined;
    const commaIdx = head.lastIndexOf(",");
    if (commaIdx !== -1) {
      const depthStr = head.slice(commaIdx + 1).trim();
      const depth = parseInt(depthStr, 10);
      if (!isNaN(depth) && depth > 0 && String(depth) === depthStr) {
        path = head.slice(0, commaIdx).trim();
        maxDepth = depth;
      }
    }

    if (!path) return { ok: false, error: "empty path" };

    let defaultAppId: string | undefined;
    if (alias !== undefined) {
      const app = apps.find((a) => a.alias === alias);
      if (!app) return { ok: false, error: `Unknown alias "@${alias}"` };
      defaultAppId = app.id;
    }

    return { ok: true, value: { path, maxDepth, defaultAppId } };
  }

  async function handleSubmit(values: { text: string }) {
    const lines = values.text.split("\n").map((l) => l.trim());
    const items: { path: string; maxDepth?: number; defaultAppId?: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const parsed = parseLine(line);
      if (!parsed.ok) {
        await showToast({ style: Toast.Style.Failure, title: `Line ${i + 1}: ${parsed.error}` });
        return;
      }
      items.push(parsed.value);
    }
    await onSave(items);
    pop();
  }

  return (
    <Form
      navigationTitle="Edit All Paths"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Paths" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="text"
        title="Paths"
        placeholder={"~/projects\n~/work/*/src,3\n~/projects/work/aaa @ij"}
        defaultValue={serialize(paths)}
        info="One path per line. Append ,N for max depth. Append @alias to set a default app (alias must match a configured app)."
      />
    </Form>
  );
}

// --- Path Form ---

function PathForm({
  item,
  apps,
  onSave,
}: {
  item?: PathItem;
  apps: AppConfig[];
  onSave: (path: string, maxDepth: number | undefined, defaultAppId: string | undefined) => Promise<void>;
}) {
  const { pop } = useNavigation();
  const [pathText, setPathText] = useState(item?.path ?? "");

  const hasGlob = /[*?[\]{}]/.test(pathText);

  async function handleSubmit(values: { pathText: string; maxDepth: string; defaultAppId: string }) {
    const trimmed = values.pathText.trim();
    if (!trimmed) return;
    const parsed = parseInt(values.maxDepth.trim(), 10);
    const maxDepth = !isNaN(parsed) && parsed > 0 ? parsed : undefined;
    const defaultAppId = values.defaultAppId ? values.defaultAppId : undefined;
    await onSave(trimmed, maxDepth, defaultAppId);
    pop();
  }

  return (
    <Form
      navigationTitle={item ? "Edit Path" : "Add Search Path"}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={item ? "Save Changes" : "Add Path"} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="picker"
        title="Browse"
        allowMultipleSelection={false}
        canChooseFiles={false}
        canChooseDirectories
        onChange={(files) => files?.[0] && setPathText(files[0])}
      />
      <Form.TextField
        id="pathText"
        title="Path / Glob"
        placeholder="~/projects or ~/work/*/src"
        info="Supports glob patterns: * matches one level, ** matches any depth"
        value={pathText}
        onChange={setPathText}
      />
      <Form.TextField
        id="maxDepth"
        title="Max Depth"
        placeholder="optional, e.g. 3"
        defaultValue={item?.maxDepth?.toString() ?? ""}
        info="Limit how many levels deep to scan. Useful with ** patterns. Leave empty for no limit."
      />
      <Form.Dropdown
        id="defaultAppId"
        title="Default App"
        defaultValue={item?.defaultAppId ?? ""}
        info={
          hasGlob
            ? "Applied as the default for folders whose path (or any ancestor) matches this glob. Overridden by per-folder defaults."
            : "Applied as the default for folders under this path. Overridden by per-folder defaults."
        }
      >
        <Form.Dropdown.Item value="" title="(none)" />
        {apps.map((a) => (
          <Form.Dropdown.Item
            key={a.id}
            value={a.id}
            title={a.name}
            icon={a.appPath ? { fileIcon: a.appPath } : Icon.AppWindow}
          />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
