import { ensureKyaInstalled, deactivateKya } from "./lib/kya";

export default async function command() {
  if (!(await ensureKyaInstalled())) return;
  await deactivateKya();
}
