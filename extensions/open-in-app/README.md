# Open in App

Fuzzy-find folders and open them in your preferred apps with alias shortcuts. Type a short alias prefix to target a specific app, or just search — frecency sorting surfaces your most-used folders first.

## Setup

This extension requires a one-time setup before use:

1. Open the **Manage Apps & Paths** command (or press `⌘⇧M` from the search view)
2. **Add at least one app** — pick an installed application and assign a short alias (e.g. `code` for VS Code, `ij` for IntelliJ)
3. **Add at least one search path** — choose a directory where your projects live (e.g. `~/projects`)

That's it. Open the **Open in App** command and start searching.

## Features

- **Fuzzy search** — find folders instantly across all configured paths
- **Alias targeting** — type `ij react` to open the first React match directly in IntelliJ
- **Frecency sorting** — folders you open most frequently rise to the top when no query is active
- **Glob patterns** — configure search paths like `~/work/*/src` or `~/projects/**` for flexible scanning
- **Multiple apps** — switch between apps from the action panel without leaving Raycast
- **Per-folder defaults** — each folder remembers which app you normally use for it; the default app becomes the Enter action
- **Filter modes** — cycle between Folders, Files, or Files & Folders with `⌘.`
- **Alias context** — typing an alias updates the navigation title and placeholder to show the active app
- **Terminal integration** — open any folder in your preferred terminal app
- **Finder reveal** — quickly show a folder in Finder

## Usage

### Basic Search

Open the **Open in App** command and start typing. Results are fuzzy-matched against folder names across all configured search paths.

### Alias Routing

Prefix your search with an app alias followed by a space:

| Input         | What Happens                                  |
| ------------- | --------------------------------------------- |
| `react`       | Search for "react", show all apps in actions  |
| `ij react`    | Search for "react", open directly in IntelliJ |
| `code my-api` | Search for "my-api", open directly in VS Code |

When using an alias, only the alias-matched app appears in the action panel. The navigation title updates to show the active app (e.g. "Open in IntelliJ IDEA") and the placeholder reflects the targeted app.

### Folder Defaults

The first time you open a folder (or file), the app you choose becomes its **default**. Subsequent opens with any app or alias won't change the default — so you can open a project in a different app without losing your usual association.

To explicitly change a folder's default, use the **Set Default & Open** section in the action panel (shortcut `⌥⌘N`).

You can also view and manage all folder defaults from the **Manage Apps & Paths** screen — change the default app via dropdown or remove entries you no longer need.

### List Display

Each result row shows:

- **Folder icon** on the left
- **Folder name** as the title (long names hide the path to preserve layout)
- **Parent path** as subtitle (truncated to last 3 segments for deep paths)
- **Default app alias** as a tag pill on the right
- **Frecency score** — digit-aligned open count

### Filter Modes

Press `⌘.` to cycle through three filter modes:

| Mode                | Shows                      |
| ------------------- | -------------------------- |
| **Folders**         | Directories only (default) |
| **Files**           | Files only                 |
| **Files & Folders** | Both files and directories |

A toast confirms the active mode and the search bar placeholder updates to reflect it. Your selection persists across sessions.

### Frecency

When the search bar is empty, folders are sorted by how often you open them. The more you use a folder, the higher it ranks. Start typing to switch to fuzzy-search ranking.

### Keyboard Shortcuts

| Shortcut | Action                                                 |
| -------- | ------------------------------------------------------ |
| `↵`      | Open in default app for that folder (or alias-matched) |
| `⌘1–9`   | Open in Nth configured app (does not change default)   |
| `⌥⌘1–9`  | Set as default & open in Nth configured app            |
| `⌘T`     | Open in default terminal                               |
| `⌘F`     | Show in Finder                                         |
| `⌘C`     | Copy path to clipboard                                 |
| `⌘.`     | Cycle filter: Folders → Files → Files & Folders        |
| `⌘⇧M`    | Manage Apps & Paths                                    |

## Configuration

### Apps

Each app has:

- **Alias** — a short prefix (no spaces) used to target the app from the search bar
- **Application** — any installed macOS application

Apps are shown in the action panel in the order you configure them. Reorder with `⌘⇧↑` / `⌘⇧↓` in the Manage Apps screen.

### Search Paths

Paths tell the extension where to look for folders. You can use:

- Plain directories: `~/projects` (scans immediate children)
- Glob patterns: `~/work/*/src` (matches one level deep), `~/repos/**` (matches any depth)

The following directories are always excluded from results: `node_modules`, `.git`, `.hg`, `.svn`, `dist`, `.cache`, `__pycache__`.

### Folder Defaults

The **Manage Apps & Paths** screen includes a **Folder Defaults** section listing all folders with a saved default app. From there you can:

- **Change** the default app via a dropdown of your configured apps
- **Remove** a default to reset a folder

### Preferences

| Preference       | Description                                      |
| ---------------- | ------------------------------------------------ |
| Default Terminal | Terminal app used when opening a folder via `⌘T` |
