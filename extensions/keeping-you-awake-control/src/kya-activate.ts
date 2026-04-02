import { getPreferenceValues } from "@raycast/api";
import { activateKya, ensureKyaInstalled, parsePositiveInt } from "./lib/kya";

export default async function command() {
  if (!(await ensureKyaInstalled())) return;

  const { defaultHours } = getPreferenceValues<{ defaultHours?: string }>();
  if (defaultHours) {
    const hours = parsePositiveInt(defaultHours, "default hours");
    if (hours == null) return;
    await activateKya({ hours });
  } else {
    await activateKya({});
  }
}
