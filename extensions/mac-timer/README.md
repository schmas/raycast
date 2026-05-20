# Mac Timer

Set timers and alarms in the macOS Clock app from Raycast.

## Commands

- **Set Timer** — Start a Clock timer. Accepts: `34s`, `10`, `10m`, `1.5h`, `5:30`, `1:30:00`.
- **Set Alarm** — Create a Clock alarm. Accepts: `7:30`, `19:00`, `7:30am`, `7:30pm`. Optional label argument.

## First Run

The extension uses an Apple Shortcut named `MacTimer` to call Clock app actions. On first run, you will be prompted to install it. Click "Install" — Shortcuts.app opens with an import sheet. Click "Add Shortcut", then re-run the command.

## Why a Shortcut?

The macOS Clock app has no public CLI or AppleScript. The Shortcuts framework is the only sanctioned bridge.

## Acknowledgments

Inspired by [Shrieking Chimes](https://alfred.app/workflows/vitor/shrieking-chimes/) by Vítor Galvão (Alfred workflow).
