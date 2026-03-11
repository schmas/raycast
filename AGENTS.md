# Raycast Extensions

**Generated:** 2026-03-11 | **Commit:** 952eda5 | **Branch:** main

## Overview

Monorepo of custom Raycast macOS extensions. One extension currently: `open-in-app`.

## Structure

```
raycast/
├── extensions/
│   └── open-in-app/   # Fuzzy-find folders and open in configured apps
└── .gitignore
```

## Where to Look

| Task | Location |
|------|----------|
| open-in-app source | `extensions/open-in-app/src/` |
| Extension manifest | `extensions/open-in-app/package.json` |
| Business logic / hooks | `extensions/open-in-app/src/lib/` |
| New extension | Create `extensions/<name>/` following open-in-app structure |

## Commands

Run from within each extension directory:

```bash
cd extensions/open-in-app
npm run dev       # Watch mode (Raycast CLI hot-reload)
npm run build     # Production build
npm run lint      # ESLint
npm run fix-lint  # ESLint --fix
npm run publish   # Submit to Raycast Store
```

## Conventions

- Each extension is fully self-contained — own `node_modules`, `package.json`, `tsconfig.json`
- Extensions are macOS-only (`"platforms": ["macOS"]` in manifest)
- `raycast-env.d.ts` is auto-generated from `package.json` — do not edit manually
- All extension config stored in Raycast LocalStorage (not system preferences files)
- TypeScript strict mode enforced in all extensions

## Adding a New Extension

1. `cd extensions && npx @raycast/api@latest create <name>`
2. Follow the hook/utility pattern from `open-in-app/src/lib/`
3. Keep commands thin — push data/logic into `src/lib/` hooks

## Notes

- Always `cd extensions/<name>` before running npm commands — there is no root-level `package.json`
- `extensions/open-in-app/plans/` contains planning docs — not source code

---

**Next:** See [`extensions/open-in-app/AGENTS.md`](./extensions/open-in-app/AGENTS.md)
