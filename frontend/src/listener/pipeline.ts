import type { EventInput, EventType } from "../types/event";
import {
  FRAME_SIZE,
  NOISE_HISTORY,
  clampFloor,
  createNoiseFloor,
  goertzelBank,
  isDeafAbove,
  makeFreqGrid,
  updateNoiseFloor,
} from "./dsp";
import {
  analyzeFrame,
  createDetector,
  pushFrame,
  type Detection,
} from "./detector";
import { classify, type Classification } from "./classifier";
import { MAX_TEXT_BEACON_MS, canHaveText, decodeBeacon } from "./decoder";
import type { Sighting, SuspicionReason } from "./suspicion";

export const MAX_EVENT_FREQS = 16;
export const MAX_EVENT_DURATION_MS = 60000;
export const BUFFER_MS = 4000;
export const DECODE_LEAD_MS = 60;
export const DECODE_TAIL_MS = 100;

export interface PipelineDetection extends Detection {
  payload: string | null;
  decodedType: EventType | null;
}

export interface CheckedDetection extends PipelineDetection {
  suspicion: SuspicionReason | null;
}

export interface Pipeline {
  processFrame: (frame: Float32Array) => PipelineDetection | null;
  isMicDeaf: () => boolean;
}

interface PendingDetection {
  detection: Detection;
  type: EventType;
  readyAtSample: number;
}

export const createPipeline = (sampleRate: number): Pipeline => {
  const freqs = makeFreqGrid(sampleRate);
  const floor = createNoiseFloor(freqs.length);
  const detector = createDetector((FRAME_SIZE / sampleRate) * 1000);
  const maxFrames = Math.ceil((BUFFER_MS * sampleRate) / 1000 / FRAME_SIZE);
  const frames: Float32Array[] = [];
  const pending: PendingDetection[] = [];
  const ready: PipelineDetection[] = [];
  let firstFrameIndex = 0;
  let frameCount = 0;
  let warmupFrames = NOISE_HISTORY;
  let rawFloor: number[] = [];

  const toSamples = (ms: number) => Math.round((ms * sampleRate) / 1000);

  const storeFrame = (frame: Float32Array) => {
    frames.push(frame);
    frameCount++;
    if (frames.length > maxFrames) {
      frames.shift();
      firstFrameIndex++;
    }
  };

  const readSamples = (from: number, to: number): Float32Array => {
    const samples = new Float32Array(to - from);
    frames.forEach((frame, i) => {
      const frameStart = (firstFrameIndex + i) * FRAME_SIZE;
      const start = Math.max(from, frameStart);
      const end = Math.min(to, frameStart + FRAME_SIZE);
      if (start < end) {
        samples.set(
          frame.subarray(start - frameStart, end - frameStart),
          start - from,
        );
      }
    });
    return samples;
  };

  const queueDetection = (detection: Detection) => {
    const { type } = classify(detection);
    const neededMs = canHaveText(type)
      ? Math.max(detection.durationMs, MAX_TEXT_BEACON_MS)
      : detection.durationMs;
    const readyAtSample = toSamples(
      detection.startMs + neededMs + DECODE_TAIL_MS,
    );
    pending.push({ detection, type, readyAtSample });
  };

  const releaseReady = () => {
    const receivedSamples = frameCount * FRAME_SIZE;
    while (pending.length > 0 && pending[0].readyAtSample <= receivedSamples) {
      const { detection, type, readyAtSample } = pending.shift()!;
      const from = Math.max(0, toSamples(detection.startMs - DECODE_LEAD_MS));
      const decoded = detection.isBeacon
        ? decodeBeacon(readSamples(from, readyAtSample), sampleRate, type)
        : null;
      ready.push({
        ...detection,
        payload: decoded?.payload ?? null,
        decodedType: decoded?.type ?? null,
      });
    }
  };

  const processFrame = (frame: Float32Array): PipelineDetection | null => {
    storeFrame(frame);
    const levels = goertzelBank(frame, freqs, sampleRate);
    rawFloor = updateNoiseFloor(floor, levels);
    const floorLevels = clampFloor(rawFloor);
    if (warmupFrames > 0) {
      warmupFrames--;
      detector.frameIndex++;
      return null;
    }
    const detection = pushFrame(
      detector,
      analyzeFrame(levels, floorLevels, freqs),
    );
    if (detection) {
      queueDetection(detection);
    }
    releaseReady();
    return ready.shift() ?? null;
  };

  const isMicDeaf = () => warmupFrames === 0 && isDeafAbove(rawFloor, freqs);

  return { processFrame, isMicDeaf };
};

export const getDetectionType = (
  detection: PipelineDetection,
): Classification => {
  if (detection.decodedType) {
    return { type: detection.decodedType, confidence: 1 };
  }
  return classify(detection);
};

export const toSighting = (detection: PipelineDetection): Sighting => {
  const { type, confidence } = getDetectionType(detection);
  return {
    type,
    confidence,
    peakFreqHz: detection.peakFreqHz,
    payload: detection.payload,
    atMs: detection.startMs,
  };
};

const roundTo = (value: number, digits: number) =>
  Math.round(value * 10 ** digits) / 10 ** digits;

export const toEventInput = (
  detection: CheckedDetection,
  startedAtMs: number,
  sampleRate: number,
): EventInput => {
  const durationMs = Math.round(detection.durationMs);
  const { type, confidence } = getDetectionType(detection);
  return {
    id: crypto.randomUUID(),
    startedAt: new Date(startedAtMs + detection.startMs).toISOString(),
    durationMs: Math.min(Math.max(durationMs, 1), MAX_EVENT_DURATION_MS),
    type,
    confidence,
    peakFreqHz: detection.peakFreqHz,
    freqsHz: detection.freqsHz.slice(0, MAX_EVENT_FREQS),
    snrDb: Math.round(detection.maxSnrDb * 10) / 10,
    payload: detection.payload,
    sampleRate,
    features: {
      meanEntropy: roundTo(detection.meanEntropy, 3),
      isStable: detection.isStable,
      isSweep: detection.isSweep,
      mainPeaksHz: detection.mainPeaksHz.slice(0, MAX_EVENT_FREQS),
      meanFrameFreqs: roundTo(detection.meanFrameFreqs, 2),
      switchRate: roundTo(detection.switchRate, 3),
      decodedType: detection.decodedType,
      suspicion: detection.suspicion,
    },
  };
};
