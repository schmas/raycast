export type TimeResult = { hour: number; minute: number } | { error: string };

const ERROR = "Alarm time must be HH:MM or H:MMam/pm";

export function parseTime(input: string): TimeResult {
  const match = input.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return { error: ERROR };

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3]?.toLowerCase();

  if (minute < 0 || minute > 59) return { error: ERROR };

  if (meridiem) {
    if (hour < 1 || hour > 12) return { error: ERROR };
    if (meridiem === "am") {
      hour = hour === 12 ? 0 : hour;
    } else {
      hour = hour === 12 ? 12 : hour + 12;
    }
  } else {
    if (hour < 0 || hour > 23) return { error: ERROR };
  }

  return { hour, minute };
}

export function formatTimePayload(time: { hour: number; minute: number }): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(time.hour)}:${pad(time.minute)}`;
}
