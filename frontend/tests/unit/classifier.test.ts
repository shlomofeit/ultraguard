import { describe, expect, it } from "vitest";
import { classify } from "../../src/listener/classifier";
import type { Detection } from "../../src/listener/detector";
import { createPipeline } from "../../src/listener/pipeline";
import { FRAME_SIZE } from "../../src/listener/dsp";
import { generateBeacon } from "../../src/listener/beaconGenerator";
import type { BeaconType } from "../../src/types/beacon";

const makeDetection = (overrides: Partial<Detection>): Detection => ({
  startMs: 0,
  durationMs: 500,
  peakFreqHz: 19000,
  freqsHz: [19000],
  maxSnrDb: 30,
  meanEntropy: 0.2,
  isStable: true,
  isSweep: false,
  isBeacon: true,
  mainPeaksHz: [19000],
  meanFrameFreqs: 1,
  switchRate: 0,
  ...overrides,
});

describe("classify rules", () => {
  it("returns noise when the detection is not a beacon", () => {
    expect(classify(makeDetection({ isBeacon: false })).type).toBe("noise");
  });

  it("returns chirp for a sweep", () => {
    expect(classify(makeDetection({ isSweep: true })).type).toBe("chirp");
  });

  it("returns tone for one steady frequency", () => {
    const result = classify(makeDetection({}));
    expect(result.type).toBe("tone");
    expect(result.confidence).toBe(1);
  });

  it("returns silverpush for one tone hopping between its four frequencies", () => {
    const result = classify(
      makeDetection({
        mainPeaksHz: [18000, 18500, 19000, 19500],
        freqsHz: [18000, 18500, 19000, 19500],
        meanFrameFreqs: 1.4,
        switchRate: 0.4,
      }),
    );
    expect(result.type).toBe("silverpush");
  });

  it("returns mosquito for two frequencies with wide frames", () => {
    const result = classify(
      makeDetection({
        mainPeaksHz: [18750, 19500],
        freqsHz: [18500, 18750, 19000, 19250, 19500, 19750],
        meanFrameFreqs: 4,
        switchRate: 0.5,
      }),
    );
    expect(result.type).toBe("mosquito");
    expect(result.confidence).toBe(1);
  });

  it("returns lisnr for many parallel tones in its band", () => {
    const result = classify(
      makeDetection({
        mainPeaksHz: [17250, 17750, 18250, 18500],
        freqsHz: [17000, 17250, 17500, 17750, 18000, 18250, 18500, 18750],
        meanFrameFreqs: 5,
        switchRate: 0.8,
      }),
    );
    expect(result.type).toBe("lisnr");
  });

  it("returns unknown when no type fits well", () => {
    const result = classify(
      makeDetection({
        mainPeaksHz: [16000, 21000],
        freqsHz: [16000, 16500, 20500, 21000, 21500, 22000],
        meanFrameFreqs: 2,
        switchRate: 0.1,
      }),
    );
    expect(result.type).toBe("unknown");
    expect(result.confidence).toBeLessThan(0.75);
  });
});

const TYPES: BeaconType[] = [
  "silverpush",
  "mosquito",
  "lisnr",
  "chirp",
  "tone",
];
const TEXTS = ["UG01", "hello", "shlomo", "1234"];

const detectFirst = (type: BeaconType, text: string, sampleRate: number) => {
  const beacon = generateBeacon(type, text, sampleRate);
  const samples = new Float32Array(sampleRate * 4 + beacon.length);
  samples.set(beacon, sampleRate * 2);
  for (let i = 0; i < samples.length; i++) {
    samples[i] += Math.sin(i * 12.9898) * 0.001;
  }
  const pipeline = createPipeline(sampleRate);
  for (
    let start = 0;
    start + FRAME_SIZE <= samples.length;
    start += FRAME_SIZE
  ) {
    const detection = pipeline.processFrame(
      samples.slice(start, start + FRAME_SIZE),
    );
    if (detection?.isBeacon) {
      return detection;
    }
  }
  return null;
};

describe("classify generated beacons", () => {
  it("recognizes at least 90% of generated beacons", () => {
    let total = 0;
    let correct = 0;
    for (const sampleRate of [44100, 48000]) {
      for (const type of TYPES) {
        for (const text of TEXTS) {
          total++;
          const detection = detectFirst(type, text, sampleRate);
          if (detection && classify(detection).type === type) {
            correct++;
          }
        }
      }
    }
    expect(correct / total).toBeGreaterThanOrEqual(0.9);
  }, 60000);
});
