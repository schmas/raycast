import { confirmAlert, environment, LocalStorage } from "@raycast/api";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";

const execFileP = promisify(execFile);

const SHORTCUT_NAME = "MacTimer";
const INSTALLED_KEY = "shortcut_installed";

export class ShortcutNotInstalledError extends Error {
  constructor() {
    super("MacTimer shortcut is not installed");
    this.name = "ShortcutNotInstalledError";
  }
}

export class ShortcutInvocationError extends Error {
  constructor(public readonly stderr: string) {
    super("Shortcut invocation failed");
    this.name = "ShortcutInvocationError";
  }
}

async function isInstalled(): Promise<boolean> {
  const cached = await LocalStorage.getItem<string>(INSTALLED_KEY);
  if (cached === "true") return true;

  const { stdout } = await execFileP("/usr/bin/shortcuts", ["list"]);
  const installed = stdout
    .split("\n")
    .map((line) => line.trim())
    .includes(SHORTCUT_NAME);

  if (installed) {
    await LocalStorage.setItem(INSTALLED_KEY, "true");
  }
  return installed;
}

async function promptInstall(): Promise<void> {
  const confirmed = await confirmAlert({
    title: "MacTimer shortcut is not installed",
    message: "Install the bundled shortcut now? Shortcuts.app will open.",
    primaryAction: { title: "Install" },
  });
  if (!confirmed) throw new ShortcutNotInstalledError();

  const shortcutPath = join(environment.assetsPath, "MacTimer.shortcut");
  await execFileP("/usr/bin/open", [shortcutPath]);
  throw new ShortcutNotInstalledError();
}

export async function runMacTimer(payload: string): Promise<void> {
  if (!(await isInstalled())) {
    await promptInstall();
  }

  try {
    await execFileP("/usr/bin/shortcuts", ["run", SHORTCUT_NAME, "--input-path", "-"], {
      input: payload,
      timeout: 5000,
    } as Parameters<typeof execFileP>[2]);
  } catch (err) {
    const error = err as NodeJS.ErrnoException & { stderr?: string };
    const stderr = error.stderr ?? error.message;

    if (/not found|no shortcut/i.test(stderr)) {
      await LocalStorage.removeItem(INSTALLED_KEY);
      throw new ShortcutNotInstalledError();
    }
    throw new ShortcutInvocationError(stderr);
  }
}
