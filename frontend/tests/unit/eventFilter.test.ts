import { describe, expect, it } from "vitest";
import {
  countEventsByType,
  getFromDate,
  matchesFilter,
} from "../../src/utils/eventFilter";
import type { Event, EventType } from "../../src/types/event";

const NOW_MS = Date.parse("2026-10-11T12:00:00.000Z");

const makeEvent = (type: EventType, startedAt: string): Event => ({
  id: crypto.randomUUID(),
  deviceId: "device-1",
  roomId: "room-1",
  startedAt,
  receivedAt: startedAt,
  durationMs: 500,
  type,
  confidence: 1,
  peakFreqHz: 18000,
  freqsHz: [18000],
  snrDb: 30,
  payload: null,
  sampleRate: 44100,
  isKnownSource: false,
});

describe("event filter", () => {
  it("has no start date for all time", () => {
    expect(getFromDate({ type: "all", rangeHours: 0 }, NOW_MS)).toBeUndefined();
  });

  it("starts the range the given hours before now", () => {
    expect(getFromDate({ type: "all", rangeHours: 1 }, NOW_MS)).toBe(
      "2026-10-11T11:00:00.000Z",
    );
  });

  it("keeps only events of the chosen type inside the range", () => {
    const filter = { type: "lisnr" as const, rangeHours: 1 };
    const recentLisnr = makeEvent("lisnr", "2026-10-11T11:30:00.000Z");
    const oldLisnr = makeEvent("lisnr", "2026-10-11T09:00:00.000Z");
    const recentTone = makeEvent("tone", "2026-10-11T11:30:00.000Z");

    expect(matchesFilter(recentLisnr, filter, NOW_MS)).toBe(true);
    expect(matchesFilter(oldLisnr, filter, NOW_MS)).toBe(false);
    expect(matchesFilter(recentTone, filter, NOW_MS)).toBe(false);
  });

  it("counts events by type", () => {
    const events = [
      makeEvent("tone", "2026-10-11T11:00:00.000Z"),
      makeEvent("tone", "2026-10-11T11:01:00.000Z"),
      makeEvent("chirp", "2026-10-11T11:02:00.000Z"),
    ];
    const counts = countEventsByType(events);

    expect(counts.get("tone")).toBe(2);
    expect(counts.get("chirp")).toBe(1);
    expect(counts.get("lisnr")).toBeUndefined();
  });
});
