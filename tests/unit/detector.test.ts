import { describe, expect, it } from "vitest";
import {
  analyzeFrame,
  createDetector,
  pushFrame,
  spectralEntropy,
  type Detection,
} from "../../public/listener/detector";
import {
  FRAME_SIZE,
  createNoiseFloor,
  goertzelBank,
  makeFreqGrid,
  updateNoiseFloor,
} from "../../public/listener/dsp";
import {
  generateBeacon,
  renderSegments,
} from "../../public/listener/beaconGenerator";

const SAMPLE_RATE = 48000;
const NOISE_LEVEL = 0.001;
const QUIET_SECONDS = 1.5;

const makeRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const withNoise = (signal: Float32Array, seed = 1): Float32Array => {
  const random = makeRandom(seed);
  const quiet = Math.round(QUIET_SECONDS * SAMPLE_RATE);
  const samples = new Float32Array(quiet + signal.length + quiet);
  samples.set(signal, quiet);
  for (let i = 0; i < samples.length; i++) {
    samples[i] += (random() * 2 - 1) * NOISE_LEVEL;
  }
  return samples;
};

const scale = (signal: Float32Array, factor: number): Float32Array => {
  return signal.map((value) => value * factor);
};

const whiteNoise = (
  seconds: number,
  amplitude: number,
  seed = 7,
): Float32Array => {
  const random = makeRandom(seed);
  const samples = new Float32Array(Math.round(seconds * SAMPLE_RATE));
  for (let i = 0; i < samples.length; i++) {
    samples[i] = (random() * 2 - 1) * amplitude;
  }
  return samples;
};

const detect = (samples: Float32Array): Detection[] => {
  const freqs = makeFreqGrid(SAMPLE_RATE);
  const floor = createNoiseFloor(freqs.length);
  const detector = createDetector((FRAME_SIZE / SAMPLE_RATE) * 1000);
  const detections: Detection[] = [];

  for (
    let start = 0;
    start + FRAME_SIZE <= samples.length;
    start += FRAME_SIZE
  ) {
    const levels = goertzelBank(
      samples.slice(start, start + FRAME_SIZE),
      freqs,
      SAMPLE_RATE,
    );
    const floorLevels = updateNoiseFloor(floor, levels);
    const detection = pushFrame(
      detector,
      analyzeFrame(levels, floorLevels, freqs),
    );
    if (detection) {
      detections.push(detection);
    }
  }
  return detections;
};

describe("spectral entropy", () => {
  it("is near 0 for one tone and near 1 for a flat spectrum", () => {
    const floor = Array(25).fill(-100);
    const oneTone = Array(25).fill(-100);
    oneTone[10] = -20;
    expect(spectralEntropy(oneTone, floor)).toBeLessThan(0.05);
    expect(spectralEntropy(Array(25).fill(-20), floor)).toBeGreaterThan(0.99);
  });
});

describe("detector", () => {
  it("detects a silverpush beacon as one stable beacon", () => {
    const detections = detect(
      withNoise(generateBeacon("silverpush", "UG01", SAMPLE_RATE)),
    );
    expect(detections).toHaveLength(1);
    const [beacon] = detections;
    expect(beacon.isBeacon).toBe(true);
    expect(beacon.isStable).toBe(true);
    expect(beacon.freqsHz).toContain(18000);
    expect(Math.abs(beacon.durationMs - 960)).toBeLessThan(100);
  });

  it("detects a lisnr beacon even with eight tones at once", () => {
    const detections = detect(
      withNoise(generateBeacon("lisnr", "UG01", SAMPLE_RATE)),
    );
    expect(detections).toHaveLength(1);
    expect(detections[0].isBeacon).toBe(true);
    expect(detections[0].meanEntropy).toBeLessThan(0.8);
  });

  it("detects a chirp as a sweep", () => {
    const detections = detect(
      withNoise(generateBeacon("chirp", "", SAMPLE_RATE)),
    );
    expect(detections).toHaveLength(1);
    expect(detections[0].isSweep).toBe(true);
    expect(detections[0].isBeacon).toBe(true);
  });

  it("ignores a weak beacon below the threshold", () => {
    const weak = scale(
      generateBeacon("silverpush", "UG01", SAMPLE_RATE),
      0.00005,
    );
    expect(detect(withNoise(weak))).toHaveLength(0);
  });

  it("rejects a loud burst of white noise", () => {
    const detections = detect(withNoise(whiteNoise(0.3, 0.3)));
    expect(detections.length).toBeGreaterThan(0);
    expect(detections.every((detection) => !detection.isBeacon)).toBe(true);
  });

  it("rejects tones that jump around randomly", () => {
    const random = makeRandom(3);
    const freqs = makeFreqGrid(SAMPLE_RATE);
    const segments = Array.from({ length: 30 }, () => ({
      kind: "tones" as const,
      freqsHz: [freqs[Math.floor(random() * freqs.length)]],
      durationMs: 25,
    }));
    const detections = detect(withNoise(renderSegments(segments, SAMPLE_RATE)));
    expect(detections).toHaveLength(1);
    expect(detections[0].isStable).toBe(false);
    expect(detections[0].isBeacon).toBe(false);
  });
});
