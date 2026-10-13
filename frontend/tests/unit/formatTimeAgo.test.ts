import { describe, expect, it } from "vitest";
import { formatTimeAgo } from "../../src/utils/formatTimeAgo";

const NOW = new Date("2026-10-13T12:00:00.000Z").getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatTimeAgo", () => {
  it("says the device never connected when there is no time", () => {
    expect(formatTimeAgo(null, NOW)).toBe("לא התחבר");
  });

  it("uses minutes and hours in natural Hebrew", () => {
    expect(formatTimeAgo(ago(20 * 1000), NOW)).toBe("עכשיו");
    expect(formatTimeAgo(ago(MINUTE), NOW)).toBe("לפני דקה");
    expect(formatTimeAgo(ago(5 * MINUTE), NOW)).toBe("לפני 5 דקות");
    expect(formatTimeAgo(ago(HOUR), NOW)).toBe("לפני שעה");
    expect(formatTimeAgo(ago(2 * HOUR), NOW)).toBe("לפני שעתיים");
    expect(formatTimeAgo(ago(5 * HOUR), NOW)).toBe("לפני 5 שעות");
  });

  it("uses days for the last week and a date after that", () => {
    expect(formatTimeAgo(ago(DAY), NOW)).toBe("אתמול");
    expect(formatTimeAgo(ago(2 * DAY), NOW)).toBe("לפני יומיים");
    expect(formatTimeAgo(ago(4 * DAY), NOW)).toBe("לפני 4 ימים");
    expect(formatTimeAgo(ago(10 * DAY), NOW)).toBe(
      new Date(ago(10 * DAY)).toLocaleDateString("he-IL"),
    );
  });
});
