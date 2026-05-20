export type DurationResult = { seconds: number } | { error: string };

const MAX_SECONDS = 86400;

export function parseDuration(input: string): DurationResult {
  if (!/^\d/.test(input)) {
    return { error: "Timer must start with a number" };
  }

  let seconds: number;

  if (/\d\s*s/.test(input)) {
    seconds = parseInt(input, 10);
  } else if (/^\d+:\d+:\d+/.test(input)) {
    const [h, m, s] = input.split(":").map((part) => parseInt(part, 10));
    seconds = h * 3600 + m * 60 + s;
  } else if (/^\d+:\d+/.test(input)) {
    const [m, s] = input.split(":").map((part) => parseInt(part, 10));
    seconds = m * 60 + s;
  } else if (/\d\s*h/.test(input)) {
    seconds = Math.round(parseFloat(input) * 3600);
  } else {
    const minutes = parseInt(input, 10);
    seconds = minutes * 60;
  }

  if (seconds >= MAX_SECONDS) {
    return { error: "Timer must be under 24 hours" };
  }

  return { seconds };
}
