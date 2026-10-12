import type { EventType } from "../types/event";

export const SUSPICION_WINDOW_MS = 60000;
export const STRONG_CONFIDENCE = 0.9;
export const KNOWN_TYPE_REPEATS = 2;
export const SAME_SOURCE_REPEATS = 3;
export const SAME_FREQ_HZ = 250;

export type SuspicionReason = "decoded" | "repeated-type" | "repeated-freq";

export interface Sighting {
  type: EventType;
  confidence: number;
  peakFreqHz: number;
  payload: string | null;
  atMs: number;
}

export interface SuspicionTracker {
  check: (sighting: Sighting) => SuspicionReason | null;
}

const KNOWN_TYPES: EventType[] = ["silverpush", "lisnr", "mosquito", "chirp", "tone"];

export const createSuspicionTracker = (): SuspicionTracker => {
  let recent: Sighting[] = [];

  const check = (sighting: Sighting): SuspicionReason | null => {
    if (sighting.type === "noise") {
      return null;
    }
    recent = recent.filter(
      (item) => sighting.atMs - item.atMs <= SUSPICION_WINDOW_MS,
    );
    recent.push(sighting);

    if (sighting.payload) {
      return "decoded";
    }

    const isStrongKnown =
      KNOWN_TYPES.includes(sighting.type) &&
      sighting.confidence >= STRONG_CONFIDENCE;
    const sameType = recent.filter(
      (item) =>
        item.type === sighting.type && item.confidence >= STRONG_CONFIDENCE,
    );
    if (isStrongKnown && sameType.length >= KNOWN_TYPE_REPEATS) {
      return "repeated-type";
    }

    const sameFreq = recent.filter(
      (item) => Math.abs(item.peakFreqHz - sighting.peakFreqHz) <= SAME_FREQ_HZ,
    );
    if (sameFreq.length >= SAME_SOURCE_REPEATS) {
      return "repeated-freq";
    }

    return null;
  };

  return { check };
};
