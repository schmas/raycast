import { describe, expect, it } from "vitest";
import { parseDuration } from "./parse-duration";

describe("parseDuration", () => {
  it.each([
    ["34s", 34],
    ["1s", 1],
    ["10", 600],
    ["10m", 600],
    ["1m", 60],
    ["1.5h", 5400],
    ["2h", 7200],
    ["5:30", 330],
    ["0:30", 30],
    ["1:30:00", 5400],
    ["1:0:0", 3600],
  ])("parses %s as %d seconds", (input, expected) => {
    const result = parseDuration(input);
    expect(result).toEqual({ seconds: expected });
  });

  it.each([
    ["abc", "Timer must start with a number"],
    ["", "Timer must start with a number"],
    [" 10m", "Timer must start with a number"],
    ["-5", "Timer must start with a number"],
  ])("rejects %s with %s", (input, expected) => {
    const result = parseDuration(input);
    expect(result).toEqual({ error: expected });
  });

  it("rejects 24h exactly", () => {
    const result = parseDuration("24h");
    expect(result).toEqual({ error: "Timer must be under 24 hours" });
  });

  it("rejects 25h", () => {
    const result = parseDuration("25h");
    expect(result).toEqual({ error: "Timer must be under 24 hours" });
  });

  it("rejects 86400s exactly", () => {
    const result = parseDuration("86400s");
    expect(result).toEqual({ error: "Timer must be under 24 hours" });
  });

  it("accepts 86399s (boundary)", () => {
    const result = parseDuration("86399s");
    expect(result).toEqual({ seconds: 86399 });
  });
});
