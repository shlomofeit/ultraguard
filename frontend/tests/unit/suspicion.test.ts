import { describe, expect, it } from "vitest";
import {
  SUSPICION_WINDOW_MS,
  createSuspicionTracker,
  type Sighting,
} from "../../src/listener/suspicion";

const sighting = (changes: Partial<Sighting> = {}): Sighting => ({
  type: "unknown",
  confidence: 0.5,
  peakFreqHz: 18000,
  payload: null,
  atMs: 0,
  ...changes,
});

describe("suspicion tracker", () => {
  it("marks a decoded beacon as suspicious right away", () => {
    const tracker = createSuspicionTracker();
    expect(tracker.check(sighting({ payload: "hello" }))).toBe("decoded");
  });

  it("never marks noise as suspicious", () => {
    const tracker = createSuspicionTracker();
    for (let i = 0; i < 5; i++) {
      expect(tracker.check(sighting({ type: "noise", atMs: i * 1000 }))).toBe(
        null,
      );
    }
  });

  it("marks a strong known type the second time it shows up", () => {
    const tracker = createSuspicionTracker();
    const strong = { type: "silverpush" as const, confidence: 0.95 };
    expect(tracker.check(sighting({ ...strong, peakFreqHz: 18000 }))).toBe(
      null,
    );
    expect(
      tracker.check(sighting({ ...strong, peakFreqHz: 19500, atMs: 5000 })),
    ).toBe("repeated-type");
  });

  it("does not count a weak known type as a repeat", () => {
    const tracker = createSuspicionTracker();
    const weak = { type: "tone" as const, confidence: 0.8 };
    expect(tracker.check(sighting({ ...weak, peakFreqHz: 17000 }))).toBe(null);
    expect(
      tracker.check(sighting({ ...weak, peakFreqHz: 20000, atMs: 1000 })),
    ).toBe(null);
  });

  it("marks anything that repeats 3 times from the same frequency", () => {
    const tracker = createSuspicionTracker();
    expect(tracker.check(sighting({ peakFreqHz: 18000 }))).toBe(null);
    expect(tracker.check(sighting({ peakFreqHz: 18250, atMs: 1000 }))).toBe(
      null,
    );
    expect(tracker.check(sighting({ peakFreqHz: 18125, atMs: 2000 }))).toBe(
      "repeated-freq",
    );
  });

  it("does not count different frequencies as the same source", () => {
    const tracker = createSuspicionTracker();
    tracker.check(sighting({ peakFreqHz: 16000 }));
    tracker.check(sighting({ peakFreqHz: 18000, atMs: 1000 }));
    expect(tracker.check(sighting({ peakFreqHz: 20000, atMs: 2000 }))).toBe(
      null,
    );
  });

  it("forgets sightings older than the window", () => {
    const tracker = createSuspicionTracker();
    tracker.check(sighting({ atMs: 0 }));
    tracker.check(sighting({ atMs: 1000 }));
    expect(
      tracker.check(sighting({ atMs: SUSPICION_WINDOW_MS + 1500 })),
    ).toBe(null);
  });
});
