import { LaunchProps } from "@raycast/api";
import { activateKya, ensureKyaInstalled, parsePositiveInt } from "./lib/kya";

export default async function command(props: LaunchProps<{ arguments: { minutes: string } }>) {
  if (!(await ensureKyaInstalled())) return;
  const minutes = parsePositiveInt(props.arguments.minutes, "minutes");
  if (minutes == null) return;
  await activateKya({ minutes });
}
