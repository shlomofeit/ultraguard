import type { EventInput } from "../types/event";
import {
  FRAME_SIZE,
  NOISE_HISTORY,
  createNoiseFloor,
  goertzelBank,
  makeFreqGrid,
  updateNoiseFloor,
} from "./dsp";
import {
  analyzeFrame,
  createDetector,
  pushFrame,
  type Detection,
} from "./detector";

export const MAX_EVENT_FREQS = 16;
export const MAX_EVENT_DURATION_MS = 60000;

export interface Pipeline {
  processFrame: (frame: Float32Array) => Detection | null;
}

export const createPipeline = (sampleRate: number): Pipeline => {
  const freqs = makeFreqGrid(sampleRate);
  const floor = createNoiseFloor(freqs.length);
  const detector = createDetector((FRAME_SIZE / sampleRate) * 1000);
  let warmupFrames = NOISE_HISTORY;

  const processFrame = (frame: Float32Array): Detection | null => {
    const levels = goertzelBank(frame, freqs, sampleRate);
    const floorLevels = updateNoiseFloor(floor, levels);
    if (warmupFrames > 0) {
      warmupFrames--;
      detector.frameIndex++;
      return null;
    }
    return pushFrame(detector, analyzeFrame(levels, floorLevels, freqs));
  };

  return { processFrame };
};

export const toEventInput = (
  detection: Detection,
  startedAtMs: number,
  sampleRate: number,
): EventInput => {
  const durationMs = Math.round(detection.durationMs);
  return {
    id: crypto.randomUUID(),
    startedAt: new Date(startedAtMs + detection.startMs).toISOString(),
    durationMs: Math.min(Math.max(durationMs, 1), MAX_EVENT_DURATION_MS),
    type: "unknown",
    confidence: 0,
    peakFreqHz: detection.peakFreqHz,
    freqsHz: detection.freqsHz.slice(0, MAX_EVENT_FREQS),
    snrDb: Math.round(detection.maxSnrDb * 10) / 10,
    payload: null,
    sampleRate,
  };
};
