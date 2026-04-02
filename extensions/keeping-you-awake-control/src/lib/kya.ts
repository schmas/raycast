import { getApplications, showHUD, showToast, Toast } from "@raycast/api";
import { execSync } from "child_process";

const KYA_BUNDLE_ID = "info.marcel-dierkes.KeepingYouAwake";
const KYA_URL = "https://keepingyouawake.app/";

function openUrl(url: string): void {
  execSync(`open -g "${url}"`);
}

export async function ensureKyaInstalled(): Promise<boolean> {
  const apps = await getApplications();
  const found = apps.some((a) => a.bundleId === KYA_BUNDLE_ID);
  if (!found) {
    await showToast({
      style: Toast.Style.Failure,
      title: "KeepingYouAwake not found",
      message: `Install it from ${KYA_URL}`,
      primaryAction: {
        title: "Open Website",
        onAction: () => openUrl(KYA_URL),
      },
    });
  }
  return found;
}

export async function toggleKya(): Promise<void> {
  openUrl("keepingyouawake:///toggle");
  await showHUD("☕ Toggled KeepingYouAwake");
}

export async function activateKya(opts: { hours?: number; minutes?: number } = {}): Promise<void> {
  if (opts.hours != null) {
    openUrl(`keepingyouawake:///activate?hours=${opts.hours}`);
    await showHUD(`☕ Activated for ${opts.hours} hour${opts.hours === 1 ? "" : "s"}`);
  } else if (opts.minutes != null) {
    openUrl(`keepingyouawake:///activate?minutes=${opts.minutes}`);
    await showHUD(`☕ Activated for ${opts.minutes} minute${opts.minutes === 1 ? "" : "s"}`);
  } else {
    openUrl("keepingyouawake:///activate");
    await showHUD("☕ Activated KeepingYouAwake");
  }
}

export async function deactivateKya(): Promise<void> {
  openUrl("keepingyouawake:///deactivate");
  await showHUD("😴 Deactivated KeepingYouAwake");
}

export function parsePositiveInt(value: string, label: string): number | null {
  const n = parseInt(value, 10);
  if (isNaN(n) || n <= 0) {
    showToast({ style: Toast.Style.Failure, title: `Invalid ${label}`, message: "Enter a positive number" });
    return null;
  }
  return n;
}
