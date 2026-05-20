import { LaunchProps } from "@raycast/api";
import { parseDuration } from "./lib/parse-duration";
import { runMacTimer, ShortcutInvocationError, ShortcutNotInstalledError } from "./lib/shortcut";
import { failure, success } from "./lib/feedback";

type Props = LaunchProps<{ arguments: { duration: string } }>;

export default async function SetTimer(props: Props): Promise<void> {
  const { duration } = props.arguments;
  const parsed = parseDuration(duration.trim());

  if ("error" in parsed) {
    await failure(parsed.error);
    return;
  }

  const payload = `timer\n${parsed.seconds}\n`;
  try {
    await runMacTimer(payload);
    await success(`Timer set for ${formatHuman(parsed.seconds)}`);
  } catch (err) {
    if (err instanceof ShortcutNotInstalledError) return;
    if (err instanceof ShortcutInvocationError) {
      await failure("Could not set timer", "Check Shortcuts permissions.");
      console.error(err.stderr);
      return;
    }
    throw err;
  }
}

function formatHuman(seconds: number): string {
  if (seconds < 60) return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  if (remSeconds === 0) return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  return `${minutes}m ${remSeconds}s`;
}
