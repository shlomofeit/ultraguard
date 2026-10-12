import { describe, expect, it } from "vitest";
import { FRAME_SIZE } from "../../src/listener/dsp";
import { LEVEL, getRepeatMs } from "../../src/listener/beacons";
import { generateBeacon } from "../../src/listener/beaconGenerator";
import { createPipeline, toSighting } from "../../src/listener/pipeline";
import {
  createSuspicionTracker,
  type SuspicionReason,
} from "../../src/listener/suspicion";
import type { BeaconType } from "../../src/types/beacon";

const SAMPLE_RATES = [44100, 48000];
const NOISE_SECONDS = 60;
const BACKGROUND_LEVEL = 0.001;
const BEACON_LEVEL = 0.05;
const BEACON_REPEATS = 3;
const BEACON_TYPES: BeaconType[] = [
  "silverpush",
  "mosquito",
  "lisnr",
  "chirp",
  "tone",
];

const makeRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const between = (random: () => number, min: number, max: number): number =>
  min + random() * (max - min);

const lowPass = (
  samples: Float32Array,
  cutoffHz: number,
  stages: number,
  sampleRate: number,
): Float32Array => {
  const w0 = (2 * Math.PI * cutoffHz) / sampleRate;
  const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
  const cos = Math.cos(w0);
  const a0 = 1 + alpha;
  const b0 = (1 - cos) / 2 / a0;
  const b1 = (1 - cos) / a0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alpha) / a0;
  let result = samples;
  for (let stage = 0; stage < stages; stage++) {
    const input = result;
    const output = new Float32Array(input.length);
    let x1 = 0;
    let x2 = 0;
    let y1 = 0;
    let y2 = 0;
    for (let i = 0; i < input.length; i++) {
      const y = b0 * input[i] + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = input[i];
      y2 = y1;
      y1 = y;
      output[i] = y;
    }
    result = output;
  }
  return result;
};

const addSpeech = (
  samples: Float32Array,
  sampleRate: number,
  cutoffHz: number,
  stages: number,
  seed: number,
) => {
  const random = makeRandom(seed);
  const noise = samples.map(() => random() * 2 - 1);
  const voice = lowPass(noise, cutoffHz, stages, sampleRate);
  let start = 0;
  while (start < samples.length) {
    const length = Math.round(between(random, 0.12, 0.3) * sampleRate);
    const loudness = between(random, 0.05, 0.3);
    for (let i = 0; i < length && start + i < samples.length; i++) {
      const envelope = Math.sin((Math.PI * i) / length);
      samples[start + i] += voice[start + i] * envelope * loudness;
    }
    start += length + Math.round(between(random, 0.05, 0.25) * sampleRate);
  }
};

const addClaps = (samples: Float32Array, sampleRate: number, seed: number) => {
  const random = makeRandom(seed);
  const length = Math.round(0.015 * sampleRate);
  let start = 0;
  while (start + length < samples.length) {
    for (let i = 0; i < length; i++) {
      const decay = Math.exp((-5 * i) / length);
      samples[start + i] += (random() * 2 - 1) * 0.6 * decay;
    }
    start += Math.round(between(random, 0.5, 2) * sampleRate);
  }
};

const addKeys = (samples: Float32Array, sampleRate: number, seed: number) => {
  const random = makeRandom(seed);
  const length = Math.round(0.03 * sampleRate);
  let start = 0;
  while (start + length < samples.length) {
    const freqHz = between(random, 14000, 22000);
    const loudness = between(random, 0.02, 0.1);
    for (let i = 0; i < length; i++) {
      const decay = Math.exp((-5 * i) / length);
      samples[start + i] +=
        Math.sin((2 * Math.PI * freqHz * i) / sampleRate) * loudness * decay;
    }
    start += Math.round(between(random, 0.1, 0.4) * sampleRate);
  }
};

const addBackground = (samples: Float32Array, seed: number) => {
  const random = makeRandom(seed);
  for (let i = 0; i < samples.length; i++) {
    samples[i] += (random() * 2 - 1) * BACKGROUND_LEVEL;
  }
};

const findSuspicious = (
  samples: Float32Array,
  sampleRate: number,
): SuspicionReason[] => {
  const pipeline = createPipeline(sampleRate);
  const tracker = createSuspicionTracker();
  const reasons: SuspicionReason[] = [];
  for (
    let start = 0;
    start + FRAME_SIZE <= samples.length;
    start += FRAME_SIZE
  ) {
    const detection = pipeline.processFrame(
      samples.slice(start, start + FRAME_SIZE),
    );
    if (!detection?.isBeacon) {
      continue;
    }
    const reason = tracker.check(toSighting(detection));
    if (reason) {
      reasons.push(reason);
    }
  }
  return reasons;
};

const SPEECH_CASES = [
  { name: "gentle roll-off", cutoffHz: 12000, stages: 2 },
  { name: "steep roll-off", cutoffHz: 12000, stages: 6 },
  { name: "laptop microphone cut", cutoffHz: 16500, stages: 8 },
];

describe("classroom noise", () => {
  for (const sampleRate of SAMPLE_RATES) {
    for (const { name, cutoffHz, stages } of SPEECH_CASES) {
      it(`finds nothing suspicious in a minute of class at ${sampleRate} Hz with ${name}`, () => {
        const samples = new Float32Array(NOISE_SECONDS * sampleRate);
        addSpeech(samples, sampleRate, cutoffHz, stages, 11);
        addClaps(samples, sampleRate, 22);
        addKeys(samples, sampleRate, 33);
        addBackground(samples, 44);
        expect(findSuspicious(samples, sampleRate)).toEqual([]);
      });
    }

    it(`marks every beacon type that repeats 3 times at ${sampleRate} Hz`, () => {
      for (const type of BEACON_TYPES) {
        const beacon = generateBeacon(type, "UG01", sampleRate).map(
          (value) => (value * BEACON_LEVEL) / LEVEL,
        );
        const stepSamples = Math.max(
          beacon.length + sampleRate,
          Math.round((getRepeatMs(type) * sampleRate) / 1000),
        );
        const samples = new Float32Array(
          2 * sampleRate + BEACON_REPEATS * stepSamples + 2 * sampleRate,
        );
        for (let repeat = 0; repeat < BEACON_REPEATS; repeat++) {
          samples.set(beacon, 2 * sampleRate + repeat * stepSamples);
        }
        addBackground(samples, 55);
        expect(findSuspicious(samples, sampleRate).length).toBeGreaterThan(0);
      }
    });
  }
});
