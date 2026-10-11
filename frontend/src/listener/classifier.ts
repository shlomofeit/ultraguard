import type { EventType } from "../types/event";
import type { Detection } from "./detector";
import { LISNR, MOSQUITO, SILVERPUSH } from "./beacons";

export const FREQ_TOLERANCE_HZ = 125;
export const MIN_CONFIDENCE = 0.75;
export const MAX_SINGLE_TONE_FREQS = 2.5;
export const MIN_PARALLEL_TONES = 3;
export const MIN_HOPPING_RATE = 0.2;
export const MIN_LISNR_RATE = 0.5;
export const MIN_LISNR_FREQS = 5;
export const MAX_TONE_FREQS = 5;
export const SWEEP_CONFIDENCE = 0.9;

export interface Classification {
  type: EventType;
  confidence: number;
}

interface Candidate {
  type: EventType;
  checks: boolean[];
}

const isNear = (freq: number, targets: number[]) =>
  targets.some((target) => Math.abs(freq - target) <= FREQ_TOLERANCE_HZ);

const allNear = (freqs: number[], targets: number[]) =>
  freqs.length > 0 && freqs.every((freq) => isNear(freq, targets));

const getScore = (checks: boolean[]) =>
  checks.filter((check) => check).length / checks.length;

export const classify = (detection: Detection): Classification => {
  if (!detection.isBeacon) {
    return { type: "noise", confidence: 1 };
  }
  if (detection.isSweep) {
    return { type: "chirp", confidence: SWEEP_CONFIDENCE };
  }

  const peaks = detection.mainPeaksHz;
  const tonesPerFrame = detection.meanFrameFreqs;
  const hopping = detection.switchRate;
  const mosquitoFreqs = [MOSQUITO.zeroHz, MOSQUITO.oneHz];
  const lisnrFreqs = detection.freqsHz.filter((freq) =>
    isNear(freq, LISNR.freqsHz),
  );

  const candidates: Candidate[] = [
    {
      type: "silverpush",
      checks: [
        peaks.length >= 2 && peaks.length <= SILVERPUSH.freqsHz.length,
        allNear(peaks, SILVERPUSH.freqsHz),
        tonesPerFrame < MAX_SINGLE_TONE_FREQS,
        hopping >= MIN_HOPPING_RATE,
      ],
    },
    {
      type: "mosquito",
      checks: [
        peaks.length === 2,
        allNear(peaks, mosquitoFreqs),
        tonesPerFrame >= MAX_SINGLE_TONE_FREQS,
        hopping >= MIN_HOPPING_RATE,
      ],
    },
    {
      type: "lisnr",
      checks: [
        allNear(peaks, LISNR.freqsHz),
        tonesPerFrame >= MIN_PARALLEL_TONES,
        hopping >= MIN_LISNR_RATE,
        lisnrFreqs.length >= MIN_LISNR_FREQS,
      ],
    },
    {
      type: "tone",
      checks: [
        peaks.length === 1,
        hopping < MIN_HOPPING_RATE,
        tonesPerFrame < MAX_SINGLE_TONE_FREQS,
        detection.freqsHz.length <= MAX_TONE_FREQS,
      ],
    },
  ];

  let best = { type: "unknown" as EventType, confidence: 0 };
  for (const candidate of candidates) {
    const score = getScore(candidate.checks);
    if (score > best.confidence) {
      best = { type: candidate.type, confidence: score };
    }
  }

  if (best.confidence < MIN_CONFIDENCE) {
    return { type: "unknown", confidence: best.confidence };
  }
  return best;
};
