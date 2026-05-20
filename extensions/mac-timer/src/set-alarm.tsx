import { LaunchProps } from "@raycast/api";
import { formatTimePayload, parseTime } from "./lib/parse-time";
import { runMacTimer, ShortcutInvocationError, ShortcutNotInstalledError } from "./lib/shortcut";
import { failure, success } from "./lib/feedback";

type Props = LaunchProps<{ arguments: { time: string; label?: string } }>;

export default async function SetAlarm(props: Props): Promise<void> {
  const { time, label } = props.arguments;
  const parsed = parseTime(time.trim());

  if ("error" in parsed) {
    await failure(parsed.error);
    return;
  }

  const timeStr = formatTimePayload(parsed);
  const trimmedLabel = label?.trim() ?? "";
  const payload = trimmedLabel ? `alarm\n${timeStr}\n${trimmedLabel}` : `alarm\n${timeStr}\n`;

  try {
    await runMacTimer(payload);
    const suffix = trimmedLabel ? ` (${trimmedLabel})` : "";
    await success(`Alarm set for ${timeStr}${suffix}`);
  } catch (err) {
    if (err instanceof ShortcutNotInstalledError) return;
    if (err instanceof ShortcutInvocationError) {
      await failure("Could not set alarm", "Check Shortcuts permissions.");
      console.error(err.stderr);
      return;
    }
    throw err;
  }
}
