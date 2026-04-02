---
status: draft
created: 2026-04-02
scope: extensions/keeping-you-awake-control
blockedBy: []
blocks: []
---

# KeepingYouAwake Control — Raycast Extension

## Overview

Raycast extension to control [KeepingYouAwake](https://keepingyouawake.app/) (KYA) — a macOS menu bar utility that prevents sleep. Port of an existing Alfred workflow using KYA's URL scheme API.

**KYA URL Schemes** ([docs](https://github.com/newmarcel/KeepingYouAwake/blob/main/Documentation/Automation.md)):

```
keepingyouawake:///activate                  # configured default duration
keepingyouawake:///activate?hours={n}        # n hours
keepingyouawake:///activate?minutes={n}      # n minutes
keepingyouawake:///activate?seconds={n}      # n seconds
keepingyouawake:///deactivate                # off
keepingyouawake:///toggle                    # toggle on/off
```

Parameters `seconds`, `minutes`, `hours` cannot be combined.

## Commands

| Command | Title | Mode | Alias | Argument | Behavior |
|---------|-------|------|-------|----------|----------|
| `kya-toggle` | Toggle | `no-view` | `ka` | — | Calls `keepingyouawake:///toggle`. Shows toast. |
| `kya-deactivate` | Deactivate | `no-view` | `kd` | — | Deactivate KYA. |
| `kya-hours` | Activate for Hours | `no-view` | `kh` | `hours` (text, required) | Activate KYA for N hours. |
| `kya-minutes` | Activate for Minutes | `no-view` | `km` | `minutes` (text, required) | Activate KYA for N minutes. |

All commands show a HUD/toast on success or failure.

## Preferences

No extension-level preferences needed. The toggle command uses KYA's native `/toggle` endpoint (KYA manages its own default duration internally via its menu bar settings).

Raycast natively allows users to override command aliases in its settings, so keyword customization is handled by the platform.

## Toggle

KYA natively supports `keepingyouawake:///toggle` — no client-side state detection needed. The app handles toggling internally.

## KYA Installation Check

Use Raycast's `getApplications()` to search for `KeepingYouAwake` by name or bundle ID (`info.marcel-dierkes.KeepingYouAwake`). If not found, show a failure toast with a message pointing to `https://keepingyouawake.app/`.

## File Structure

```
extensions/keeping-you-awake-control/
├── package.json              # manifest — commands, prefs, args
├── src/
│   ├── kya-toggle.ts         # Toggle command
│   ├── kya-deactivate.ts     # Deactivate command
│   ├── kya-hours.ts          # Activate for X hours
│   ├── kya-minutes.ts        # Activate for X minutes
│   └── lib/
│       └── kya.ts            # Shared helpers
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── .gitignore
└── README.md
```

## Phases

### Phase 1: Manifest & Configuration

Update `package.json`:

- Fix `platforms` → `["macOS"]` only (remove Windows)
- Define 4 commands with correct `mode`, `alias`, `arguments`
- Remove preferences (no extension-level prefs needed)
- Keep existing deps (`@raycast/api`, `@raycast/utils`)

```json
{
  "commands": [
    {
      "name": "kya-toggle",
      "title": "Toggle",
      "subtitle": "KYA",
      "description": "Toggle KeepingYouAwake on/off using the default hours preference",
      "mode": "no-view",
      "alias": "ka"
    },
    {
      "name": "kya-deactivate",
      "title": "Deactivate",
      "subtitle": "KYA",
      "description": "Deactivate KeepingYouAwake",
      "mode": "no-view",
      "alias": "kd"
    },
    {
      "name": "kya-hours",
      "title": "Activate for Hours",
      "subtitle": "KYA",
      "description": "Activate KeepingYouAwake for a specified number of hours",
      "mode": "no-view",
      "alias": "kh",
      "arguments": [
        {
          "name": "hours",
          "type": "text",
          "required": true,
          "placeholder": "Hours"
        }
      ]
    },
    {
      "name": "kya-minutes",
      "title": "Activate for Minutes",
      "subtitle": "KYA",
      "description": "Activate KeepingYouAwake for a specified number of minutes",
      "mode": "no-view",
      "alias": "km",
      "arguments": [
        {
          "name": "minutes",
          "type": "text",
          "required": true,
          "placeholder": "Minutes"
        }
      ]
    }
  ],
  "preferences": []
}
```

**Files touched:** `package.json`

### Phase 2: Core Library

Create `src/lib/kya.ts` with:

1. **`ensureKyaInstalled()`** — checks `getApplications()` for KYA bundle ID, shows failure toast if missing, returns boolean
2. **`toggleKya()`** — calls `open -g "keepingyouawake:///toggle"`
3. **`activateKya(options?)`** — calls `open -g "keepingyouawake:///activate?hours=N"` or minutes variant
4. **`deactivateKya()`** — calls `open -g "keepingyouawake:///deactivate"`

Use `execSync("open -g ...")` instead of Raycast `open()` so the `-g` flag keeps KYA in the background.

**Files touched:** `src/lib/kya.ts` (new)

### Phase 3: Command Implementations

All commands are `no-view`, exported as async default functions.

**`src/kya-toggle.ts`:**
1. `ensureKyaInstalled()` → bail if missing
2. `toggleKya()` + toast "Toggled"

**`src/kya-deactivate.ts`:**
1. `ensureKyaInstalled()`
2. `deactivateKya()` + toast "Deactivated"

**`src/kya-hours.ts`:**
1. `ensureKyaInstalled()`
2. Parse `hours` argument, validate it's a positive number
3. `activateKya({ hours })` + toast "Activated for N hours"

**`src/kya-minutes.ts`:**
1. `ensureKyaInstalled()`
2. Parse `minutes` argument, validate it's a positive number
3. `activateKya({ minutes })` + toast "Activated for N minutes"

**Files touched:** `src/kya-toggle.ts` (new), `src/kya-deactivate.ts` (new), `src/kya-hours.ts` (new), `src/kya-minutes.ts` (new). Delete `src/kya-activate.ts` (old scaffold).

### Phase 4: README & Cleanup

Update `README.md`:
- Prerequisites: KeepingYouAwake link + install instructions
- Command table with aliases
- Note about alias customization via Raycast settings

Delete stale `src/kya-activate.ts`.

**Files touched:** `README.md`, `src/kya-activate.ts` (delete)

### Phase 5: GitHub Workflows

Both CI and Release workflows use a matrix strategy. Add `keeping-you-awake-control` to the matrix.

**`.github/workflows/ci.yml`:**
```yaml
matrix:
  extension: [open-in-app, keeping-you-awake-control]
```

**`.github/workflows/release.yml`:**
```yaml
matrix:
  extension: [open-in-app, keeping-you-awake-control]
```

> **Note:** The release workflow uses a single `vX.Y.Z` tag namespace shared across all extensions.
> This works today with one extension but will cause tag collisions when two extensions have different versions.
> Consider prefixing tags per extension (e.g. `open-in-app/v1.2.3`) in a follow-up — out of scope for this plan.

**Files touched:** `.github/workflows/ci.yml`, `.github/workflows/release.yml`

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| KYA not running when URL scheme called | macOS launches the app automatically on URL scheme open. |
| User enters non-numeric value for hours/minutes | Validate with `parseInt` / `parseFloat`, show failure toast. |
| `open -g` doesn't work in Raycast sandbox | Fall back to Raycast `open()` API. Test during dev. |

## Out of Scope

- Alfred Remote integration (Raycast has its own remote features)
- Custom menu bar icon/status display
- Scheduling / recurring activations
