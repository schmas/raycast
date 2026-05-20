import { describe, expect, it } from "vitest";
import { parseTime } from "./parse-time";

describe("parseTime", () => {
  it.each([
    ["7:30", { hour: 7, minute: 30 }],
    ["07:30", { hour: 7, minute: 30 }],
    ["19:00", { hour: 19, minute: 0 }],
    ["0:00", { hour: 0, minute: 0 }],
    ["23:59", { hour: 23, minute: 59 }],
    ["7:30am", { hour: 7, minute: 30 }],
    ["7:30AM", { hour: 7, minute: 30 }],
    ["7:30 am", { hour: 7, minute: 30 }],
    ["7:30pm", { hour: 19, minute: 30 }],
    ["12:00am", { hour: 0, minute: 0 }],
    ["12:00pm", { hour: 12, minute: 0 }],
    ["12:30am", { hour: 0, minute: 30 }],
    ["12:30pm", { hour: 12, minute: 30 }],
  ])("parses %s", (input, expected) => {
    const result = parseTime(input);
    expect(result).toEqual(expected);
  });

  it.each([
    ["abc"],
    [""],
    ["25:00"],
    ["12:60"],
    ["7"],
    [":30"],
    ["7:"],
    ["7:30:00"],
    ["13:00pm"],
    ["0:00pm"],
  ])("rejects %s", (input) => {
    const result = parseTime(input);
    expect(result).toEqual({ error: "Alarm time must be HH:MM or H:MMam/pm" });
  });

  it("formats payload via formatTimePayload", async () => {
    const { formatTimePayload } = await import("./parse-time");
    expect(formatTimePayload({ hour: 7, minute: 30 })).toBe("07:30");
    expect(formatTimePayload({ hour: 19, minute: 0 })).toBe("19:00");
    expect(formatTimePayload({ hour: 0, minute: 5 })).toBe("00:05");
  });
});
