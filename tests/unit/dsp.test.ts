import { describe, expect, it } from "vitest";
import {
  FRAME_SIZE,
  createNoiseFloor,
  getSnr,
  goertzelBank,
  makeFreqGrid,
  median,
  updateNoiseFloor,
} from "../../public/listener/dsp";
import { generateBeacon } from "../../public/listener/beaconGenerator";
import { LISNR } from "../../public/listener/beacons";

const SAMPLE_RATE = 48000;

const middleFrame = (samples: Float32Array): Float32Array => {
  const start = Math.floor((samples.length - FRAME_SIZE) / 2);
  return samples.slice(start, start + FRAME_SIZE);
};

const strongestFreq = (levels: number[], freqs: number[]): number => {
  const index = levels.indexOf(Math.max(...levels));
  return freqs[index];
};

describe("frequency grid", () => {
  it("starts at 16 kHz with 250 Hz steps", () => {
    const grid = makeFreqGrid(SAMPLE_RATE);
    expect(grid[0]).toBe(16000);
    expect(grid[1]).toBe(16250);
  });

  it("stays below the device limit", () => {
    expect(Math.max(...makeFreqGrid(44100))).toBeLessThan(22050);
    expect(Math.max(...makeFreqGrid(48000))).toBe(23500);
  });
});

describe("goertzel bank", () => {
  it("finds a 19 kHz tone", () => {
    const freqs = makeFreqGrid(SAMPLE_RATE);
    const frame = middleFrame(generateBeacon("tone", "", SAMPLE_RATE));
    const levels = goertzelBank(frame, freqs, SAMPLE_RATE);
    expect(strongestFreq(levels, freqs)).toBe(19000);
  });

  it("separates the tone from a neighbor 1 kHz away by more than 30 dB", () => {
    const freqs = [18000, 19000];
    const frame = middleFrame(generateBeacon("tone", "", SAMPLE_RATE));
    const [neighbor, tone] = goertzelBank(frame, freqs, SAMPLE_RATE);
    expect(tone - neighbor).toBeGreaterThan(30);
  });

  it("finds the first silverpush symbol at 18 kHz", () => {
    const freqs = makeFreqGrid(SAMPLE_RATE);
    const samples = generateBeacon("silverpush", "UG01", SAMPLE_RATE);
    const frame = samples.slice(400, 400 + FRAME_SIZE);
    expect(strongestFreq(goertzelBank(frame, freqs, SAMPLE_RATE), freqs)).toBe(
      18000,
    );
  });

  it("sees all eight lisnr tones in the preamble", () => {
    const freqs = makeFreqGrid(SAMPLE_RATE);
    const samples = generateBeacon("lisnr", "UG01", SAMPLE_RATE);
    const frame = samples.slice(800, 800 + FRAME_SIZE);
    const levels = goertzelBank(frame, freqs, SAMPLE_RATE);
    const toneLevels = LISNR.freqsHz.map((freq) => levels[freqs.indexOf(freq)]);
    const otherLevels = freqs
      .filter((freq) => freq >= 19500)
      .map((freq) => levels[freqs.indexOf(freq)]);
    expect(Math.min(...toneLevels) - Math.max(...otherLevels)).toBeGreaterThan(
      20,
    );
  });

  it("returns very low levels for silence", () => {
    const levels = goertzelBank(
      new Float32Array(FRAME_SIZE),
      [19000],
      SAMPLE_RATE,
    );
    expect(levels[0]).toBeLessThan(-150);
  });
});

describe("noise floor", () => {
  it("computes the median of odd and even lists", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("keeps the floor low when a short beacon appears", () => {
    const floor = createNoiseFloor(1, 50);
    for (let i = 0; i < 40; i++) {
      updateNoiseFloor(floor, [-80]);
    }
    const floorLevels = updateNoiseFloor(floor, [-30]);
    expect(floorLevels[0]).toBe(-80);
    expect(getSnr([-30], floorLevels)[0]).toBe(50);
  });

  it("keeps only the last values in the history", () => {
    const floor = createNoiseFloor(1, 3);
    for (const level of [-90, -90, -90, -40, -40]) {
      updateNoiseFloor(floor, [level]);
    }
    expect(floor.history[0]).toEqual([-90, -40, -40]);
  });
});
