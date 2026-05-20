# Raycast Extensions

Custom [Raycast](https://raycast.com) extensions for macOS.

## Extensions

| Extension | Description |
|-----------|-------------|
| [open-in-app](./extensions/open-in-app) | Fuzzy-find folders and open them in configured apps |
| [mac-timer](./extensions/mac-timer) | Set timers and alarms in the macOS Clock app |

---

### open-in-app

Quickly open any project folder in your preferred app. Type an alias prefix to target a specific app, or just search — frecency sorting surfaces the most-used folders first.

**Features:**
- Fuzzy search across configured directory paths
- Alias-based app targeting: type `ij react` to open the first React match in IntelliJ
- Frecency sorting — most-opened folders rise to the top automatically
- Glob pattern support in search paths (`~/work/*/src`, `~/projects/**`)
- Configurable per-app aliases, terminal integration, and Finder reveal

**Commands:**
- **Open in App** — fuzzy search and open a folder
- **Manage Apps & Paths** — configure apps and search directories

### mac-timer

Set timers and alarms in the macOS Clock app from Raycast.

**Features:**
- `Set Timer` — formats: `10s`, `5m`, `1.5h`, `5:30`, `1:30:00`
- `Set Alarm` — formats: `7:30`, `19:00`, `7:30pm`, plus an optional label argument
- Uses a bundled Apple Shortcut to call native Clock app actions
- First-run install prompt for the required shortcut

**Commands:**
- **Set Timer** — start a Clock timer
- **Set Alarm** — create a Clock alarm

Inspired by [Shrieking Chimes](https://alfred.app/workflows/vitor/shrieking-chimes/) by Vítor Galvão.

## Development

```bash
cd extensions/open-in-app
npm install
npm run dev      # Start Raycast development mode
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Publishing

```bash
cd extensions/open-in-app
npm run publish  # Submit to Raycast Store
```
