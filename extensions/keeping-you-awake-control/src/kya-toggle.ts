import { ensureKyaInstalled, toggleKya } from "./lib/kya";

export default async function command() {
  if (!(await ensureKyaInstalled())) return;
  await toggleKya();
}
