# Open in App Changelog

## [Folder Defaults] - 2026-03-28

- Per-folder default app — first open sets the default, subsequent opens don't change it
- Explicit "Set Default & Open" action panel section (`⌥⌘1–9`) to change a folder's default
- Folder Defaults management in Manage Apps & Paths — view, change, or remove defaults with frecency scores
- Action panel now preserves configured app order instead of reordering by last-used
- Alias-driven opens no longer modify the stored default
- Cleaner list display — alias tag, digit-aligned frecency score, truncated parent paths
- Long folder names auto-hide path subtitle to preserve accessory alignment

## [Initial Version] - 2026-03-11

- Fuzzy search folders across configured directory paths
- Alias-based app targeting (e.g. type `ij react` to open in IntelliJ)
- Frecency sorting — most-opened folders surface first
- Glob pattern support in search paths (`~/work/*/src`, `~/projects/**`)
- Manage Apps & Paths command for configuring apps and search directories
- Terminal integration and Finder reveal actions
- Copy path to clipboard
