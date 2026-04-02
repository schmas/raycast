import { LaunchProps } from "@raycast/api";
import { activateKya, ensureKyaInstalled, parsePositiveInt } from "./lib/kya";

export default async function command(props: LaunchProps<{ arguments: { hours: string } }>) {
  if (!(await ensureKyaInstalled())) return;
  const hours = parsePositiveInt(props.arguments.hours, "hours");
  if (hours == null) return;
  await activateKya({ hours });
}
