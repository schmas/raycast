import {
  Action,
  ActionPanel,
  Alert,
  Application,
  Form,
  Icon,
  List,
  confirmAlert,
  getApplications,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { AppConfig, useApps } from "./lib/use-apps";
import { PathItem, displayPath, usePaths } from "./lib/use-paths";

export default function ManageApps() {
  const { apps, isLoading: appsLoading, addApp, updateApp, deleteApp } = useApps();
  const { paths, isLoading: pathsLoading, addPath, updatePath, deletePath, movePath } = usePaths();

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

  return (
    <List isLoading={appsLoading || pathsLoading}>
      {/* Apps section */}
      <List.Section title="Apps">
        {apps.map((app) => (
          <List.Item
            key={app.id}
            icon={Icon.AppWindow}
            title={app.name}
            subtitle={`alias: ${app.alias}`}
            accessories={[{ text: app.bundleId }]}
            actions={
              <ActionPanel>
                <Action.Push title="Edit" target={<AppForm app={app} onSave={(v) => updateApp({ ...app, ...v })} />} />
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
              <Action.Push title="Add App" target={<AppForm onSave={addApp} />} />
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
            actions={
              <ActionPanel>
                <Action.Push
                  title="Edit"
                  icon={Icon.Pencil}
                  target={<PathForm initialPath={item.path} onSave={(p) => updatePath(item.id, p)} />}
                />
                <Action
                  title="Move up"
                  icon={Icon.ArrowUp}
                  shortcut={{ modifiers: ["cmd"], key: "arrowUp" }}
                  onAction={() => movePath(item.id, "up")}
                />
                <Action
                  title="Move Down"
                  icon={Icon.ArrowDown}
                  shortcut={{ modifiers: ["cmd"], key: "arrowDown" }}
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
          title="Add Search Path"
          icon={Icon.Plus}
          actions={
            <ActionPanel>
              <Action.Push title="Add Search Path" target={<PathForm onSave={addPath} />} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}

// --- App Form ---

interface AppFormValues {
  alias: string;
  appId: string; // bundleId or app path, from getApplications()
}

function AppForm({ app, onSave }: { app?: AppConfig; onSave: (data: Omit<AppConfig, "id">) => Promise<void> }) {
  const { pop } = useNavigation();
  const [installedApps, setInstalledApps] = useState<Application[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  useEffect(() => {
    getApplications()
      .then((apps) => setInstalledApps(apps.sort((a, b) => a.name.localeCompare(b.name))))
      .finally(() => setIsLoadingApps(false));
  }, []);

  async function handleSubmit(values: AppFormValues) {
    if (!values.alias.trim() || values.alias.includes(" ") || !values.appId) return;
    const selected = installedApps.find((a) => (a.bundleId || a.path) === values.appId);
    if (!selected) return;
    await onSave({ alias: values.alias.trim(), name: selected.name, bundleId: values.appId, appPath: selected.path });
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

// --- Path Form ---

function PathForm({ initialPath, onSave }: { initialPath?: string; onSave: (path: string) => Promise<void> }) {
  const { pop } = useNavigation();
  // Text field holds the final path/glob, pre-populated when user picks a directory
  const [pathText, setPathText] = useState(initialPath ?? "");

  async function handleSubmit(values: { pathText: string }) {
    const trimmed = values.pathText.trim();
    if (trimmed) {
      await onSave(trimmed);
      pop();
    }
  }

  return (
    <Form
      navigationTitle="Add Search Path"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Path" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      {/* Picker to select base directory — populates the text field below */}
      <Form.FilePicker
        id="picker"
        title="Browse"
        allowMultipleSelection={false}
        canChooseFiles={false}
        canChooseDirectories
        onChange={(files) => files?.[0] && setPathText(files[0])}
      />
      {/* Editable field — user can append glob patterns after browsing */}
      <Form.TextField
        id="pathText"
        title="Path / Glob"
        placeholder="~/projects or ~/work/*/src"
        info="Supports glob patterns: * matches one level, ** matches any depth"
        value={pathText}
        onChange={setPathText}
      />
    </Form>
  );
}
