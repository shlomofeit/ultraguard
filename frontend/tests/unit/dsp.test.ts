import { describe, expect, it } from "vitest";
import {
  FRAME_SIZE,
  MIN_FLOOR_DB,
  clampFloor,
  createNoiseFloor,
  getSnr,
  goertzelBank,
  isDeafAbove,
  makeFreqGrid,
  median,
  updateNoiseFloor,
} from "../../src/listener/dsp";
import { generateBeacon } from "../../src/listener/beaconGenerator";
import { LISNR } from "../../src/listener/beacons";

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

  it("never lets the floor drop below the minimum", () => {
    expect(clampFloor([-175, -108, -60])).toEqual([MIN_FLOOR_DB, -108, -60]);
  });

  it("keeps only the last values in the history", () => {
    const floor = createNoiseFloor(1, 3);
    for (const level of [-90, -90, -90, -40, -40]) {
      updateNoiseFloor(floor, [level]);
    }
    expect(floor.history[0]).toEqual([-90, -40, -40]);
  });
});

describe("deaf microphone", () => {
  const freqs = [16000, 16500, 17000, 18000, 19000, 20000];

  it("is deaf when the floor above 17 kHz is digital silence", () => {
    expect(isDeafAbove([-110, -150, -170, -175, -172, -178], freqs)).toBe(true);
  });

  it("is not deaf when it hears room noise above 17 kHz", () => {
    expect(isDeafAbove([-104, -105, -105, -106, -110, -111], freqs)).toBe(
      false,
    );
  });
});
