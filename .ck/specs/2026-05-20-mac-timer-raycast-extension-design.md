# mac-timer — Raycast extension design

**Date:** 2026-05-20
**Status:** Approved, awaiting implementation plan

## Goal

Build a Raycast extension that sets timers and alarms in the macOS Clock app, mirroring the UX of the Alfred "Shrieking Chimes" workflow by Vítor Galvão. Two no-view commands (`Set Timer`, `Set Alarm`) that take an argument, parse the input, and trigger the native Clock app via a bundled Apple Shortcut.

## Background

- The macOS Clock app has no public AppleScript or CLI. The Shortcuts framework is the only sanctioned bridge — actions `Start Timer` and `Create Alarm` are exposed only inside Shortcuts.
- The Alfred workflow installs a `.shortcut` file and pipes a multi-line payload (`action\nvalue\nlabel`) to it via Alfred's "Run Shortcut" action.
- This extension uses the same bridge: bundle a `.shortcut`, install on first run, invoke via `/usr/bin/shortcuts run`.
- The existing Raycast extension `timers-for-raycast` uses Raycast's own timer mechanism, not the Clock app. This extension intentionally targets the Clock app so alarms ring through the system clock subsystem and appear in the Clock app UI.

## Scope (v1)

In scope:
- `Set Timer` command — duration argument, starts a Clock timer.
- `Set Alarm` command — time argument + optional label, creates a Clock alarm.
- First-run install flow for the required Apple Shortcut.

Out of scope (v1):
- Listing or canceling existing timers/alarms. macOS Shortcuts does not expose `Get Alarms` or `Get Timers` actions. The Alfred original does not list either — users edit in the Clock app.
- Recurring alarms, custom alarm sounds, snooze configuration. Clock app handles these in its UI.
- Cross-platform support. macOS only (matches monorepo convention).

## Commands

| Command | Mode | Arguments |
|---|---|---|
| `Set Timer` | `no-view` | `duration` (required, text) |
| `Set Alarm` | `no-view` | `time` (required, text), `label` (optional, text) |

`no-view` runs the action and shows a HUD/toast. No window. Matches Alfred's "type and go" feel.

## Input parsing

### Timer duration

Port the parser from the Alfred workflow's `Set Timer` script filter, line-for-line equivalent:

| Input | Parsed as |
|---|---|
| `34s` | 34 seconds |
| `10` or `10m` | 10 minutes |
| `1.5h` | 90 minutes |
| `5:30` | 5 minutes 30 seconds (MM:SS) |
| `1:30:00` | 1 hour 30 minutes (HH:MM:SS) |
| starts with non-digit | error: "Timer must start with a number" |
| ≥ 86400 seconds (24h) | error: "Timer must be under 24 hours" |

Output: `{ seconds: number } | { error: string }`. Pure function, no I/O.

### Alarm time

| Input | Parsed as |
|---|---|
| `7:30` | 07:30 |
| `19:00` | 19:00 |
| `7:30am` / `7:30pm` | 07:30 / 19:30 |
| invalid | error: "Alarm time must be HH:MM or H:MMam/pm" |

Output: `{ hour: number, minute: number } | { error: string }`. Pure function. Payload formats as `HH:MM`.

Note: Clock app alarms are daily at the given time, not single-shot. The Alfred original behaves the same way. No today/tomorrow logic needed.

## Shortcut bridge

Bundled file: `assets/MacTimer.shortcut`. Single shortcut that branches on the first input line:

```
Input: text (multi-line, lines joined with newline)
  Line 1: action  ("timer" | "alarm")
  Line 2: value   (seconds for timer, "HH:MM" for alarm)
  Line 3: label   (optional, alarm only)

If action == "timer" → Start Timer (Clock) with duration = Line 2 seconds
If action == "alarm" → Create Alarm (Clock) at Line 2 time, name = Line 3 (if present)
```

Invocation from the extension:

```ts
import { execFile } from "node:child_process";

execFile(
  "/usr/bin/shortcuts",
  ["run", "MacTimer", "--input-path", "/dev/stdin"],
  { input: payload, timeout: 5000 }
);
```

If `--input-path /dev/stdin` plus `{ input: payload }` is unreliable, fall back to writing payload to a temp file (`os.tmpdir()`) and passing its path to `--input-path`.

Payload examples:
- Timer 10 min: `"timer\n600\n"`
- Alarm 7:30 with label: `"alarm\n07:30\nWake up\n"`
- Alarm 19:00 no label: `"alarm\n19:00\n"`

Why bundle a `.shortcut` file rather than generate one programmatically: the `.shortcut` format is a signed binary plist. Cannot reliably generate from code. Ship the binary, install once.

## First-run install flow

Every command run, before invoking the shortcut:

1. Check Raycast LocalStorage for `shortcut_installed=true`. If set, skip to step 5.
2. Run `shortcuts list` (no `--folder`). Parse output line-by-line.
3. If `MacTimer` present: write `shortcut_installed=true` to LocalStorage, proceed to step 5.
4. If missing:
   - Show confirm dialog: "MacTimer shortcut is not installed. Install it now?"
   - On confirm: spawn `open <extension-assets>/MacTimer.shortcut`. Shortcuts.app opens import sheet.
   - HUD: "Once installed, run the command again."
   - Abort current command. User must re-trigger after clicking "Add Shortcut" in Shortcuts.app.
5. Invoke `shortcuts run MacTimer` with the payload.
6. If invoke fails with stderr matching "shortcut not found" or similar, clear the LocalStorage flag and re-run from step 2.

Why this flow: cannot install programmatically. Shortcuts.app requires a user-consent click. `open <file.shortcut>` is the only sanctioned import path. Same UX as the Alfred original.

## Code structure

```
extensions/mac-timer/
├── package.json              # manifest: 2 commands, no-view, args
├── tsconfig.json
├── raycast-env.d.ts          # auto-generated
├── assets/
│   ├── MacTimer.shortcut     # bundled binary
│   └── command-icon.png
├── src/
│   ├── set-timer.tsx         # command entry (no-view default export)
│   ├── set-alarm.tsx         # command entry
│   └── lib/
│       ├── parse-duration.ts # timer parser, pure function
│       ├── parse-time.ts     # alarm parser, pure function
│       ├── shortcut.ts       # install check + invoke
│       └── feedback.ts       # toast/HUD helpers
└── AGENTS.md
```

### Boundaries

- `parse-duration.ts`, `parse-time.ts`: pure functions, no I/O. Trivial to unit test.
- `shortcut.ts`: the only module that touches `child_process` and LocalStorage. Exposes one API: `runMacTimer(payload: string): Promise<void>`. Handles install check, invoke, error mapping.
- `set-timer.tsx`, `set-alarm.tsx`: thin glue. Parse arg → build payload → call `runMacTimer` → toast/HUD.

This isolates the OS-touching code to one module. Parsers stay testable without macOS.

## Error handling

| Source | Example | Surface |
|---|---|---|
| Parse error | `"abc"`, `"25h"` | Failure toast with the parser's error string |
| Shortcut missing | `shortcuts list` lacks `MacTimer` | Confirm dialog → open Shortcuts.app importer |
| `shortcuts run` non-zero exit | Clock app unavailable, permission denied | Failure toast: "Could not set timer/alarm. Check Shortcuts permissions." Log stderr to console for debugging. |
| Invoke timeout (>5s) | hung shortcut | Reject the promise; failure toast: "Shortcut did not respond" |

All errors surface via Raycast's `showToast({ style: Toast.Style.Failure })`. Never silent.

## Testing

- Unit tests via Vitest. The monorepo has no existing test setup; this extension adds one. Pattern: `src/lib/*.test.ts` colocated with the modules.
- Targets: `parse-duration.ts`, `parse-time.ts`. Table-driven test cases covering every row in the parsing tables above, plus boundary conditions (0s, 86399s, 86400s, exactly 24h, malformed clock formats like `:30`, `5:`, `5::30`).
- No integration test for `shortcut.ts`. Mocking `child_process` + LocalStorage + the macOS Clock app is not worth the maintenance.
- Manual test plan in `extensions/mac-timer/AGENTS.md`: six cases (timer seconds, timer minutes, timer hours, timer MM:SS, alarm bare, alarm with label).
- Coverage target: ≥ 99.9% on `src/lib/parse-*.ts` per Lumenalta org standard. Other files exempt (I/O glue).

## Open questions

None. All gates decided during brainstorming:
- Scope: timer + alarm + label, no list/manage.
- UX: two no-view commands with arguments.
- Label: second optional argument on `Set Alarm`.
- Shortcut: bundled `.shortcut` file + first-run install prompt.
- Name: `mac-timer` (extension), `MacTimer` (bundled shortcut).
