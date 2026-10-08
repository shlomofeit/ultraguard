import { describe, expect, it } from "vitest";
import {
  buildSegments,
  byteToBits,
  byteToSymbols,
  checksum,
  generateBeacon,
  msToSamples,
  textToBytes,
} from "../../public/listener/beaconGenerator";
import { LISNR, MOSQUITO, SILVERPUSH } from "../../public/listener/beacons";
import type { ToneSegment } from "../../public/types/beacon";

const SAMPLE_RATE = 48000;

const countZeroCrossings = (samples: Float32Array): number => {
  let count = 0;
  for (let i = 1; i < samples.length; i++) {
    if (
      (samples[i - 1] < 0 && samples[i] >= 0) ||
      (samples[i - 1] >= 0 && samples[i] < 0)
    ) {
      count++;
    }
  }
  return count;
};

describe("encoding", () => {
  it("pads and cuts text to a fixed length", () => {
    expect(textToBytes("AB", 4)).toEqual([65, 66, 0, 0]);
    expect(textToBytes("ABCDEF", 4)).toEqual([65, 66, 67, 68]);
  });

  it("computes checksum as sum modulo 256", () => {
    expect(checksum([200, 100])).toBe(44);
  });

  it("splits a byte into four 2-bit symbols", () => {
    expect(byteToSymbols(0b11100100)).toEqual([3, 2, 1, 0]);
  });

  it("splits a byte into bits, most significant first", () => {
    expect(byteToBits(0xaa)).toEqual([1, 0, 1, 0, 1, 0, 1, 0]);
  });
});

describe("segments", () => {
  it("builds silverpush as preamble, payload and checksum", () => {
    const segments = buildSegments("silverpush", "UG01") as ToneSegment[];
    expect(segments).toHaveLength(
      SILVERPUSH.preamble.length + (SILVERPUSH.payloadBytes + 1) * 4,
    );
    expect(segments[0].freqsHz).toEqual([SILVERPUSH.freqsHz[0]]);
    expect(segments[1].freqsHz).toEqual([SILVERPUSH.freqsHz[3]]);
  });

  it("builds mosquito with preamble, length, text and checksum", () => {
    const segments = buildSegments("mosquito", "hi") as ToneSegment[];
    expect(segments).toHaveLength((1 + 1 + 2 + 1) * 8);
    expect(segments[0].freqsHz).toEqual([MOSQUITO.oneHz]);
    expect(segments[1].freqsHz).toEqual([MOSQUITO.zeroHz]);
  });

  it("limits mosquito text to the maximum length", () => {
    const segments = buildSegments("mosquito", "x".repeat(40));
    expect(segments).toHaveLength((1 + 1 + MOSQUITO.maxBytes + 1) * 8);
  });

  it("builds lisnr with all tones in the preamble and one tone per set bit", () => {
    const segments = buildSegments("lisnr", "\u0001") as ToneSegment[];
    expect(segments[0].freqsHz).toEqual(LISNR.freqsHz);
    expect(segments[1].freqsHz).toEqual([LISNR.freqsHz[0]]);
    expect(segments[2].freqsHz).toEqual([]);
  });
});

describe("samples", () => {
  it("renders a tone with the right frequency", () => {
    const samples = generateBeacon("tone", "", SAMPLE_RATE);
    expect(samples).toHaveLength(SAMPLE_RATE);
    expect(Math.abs(countZeroCrossings(samples) - 38000)).toBeLessThan(50);
  });

  it("renders the first silverpush symbol at 18 kHz", () => {
    const samples = generateBeacon("silverpush", "UG01", SAMPLE_RATE);
    const symbolLength = msToSamples(SILVERPUSH.symbolMs, SAMPLE_RATE);
    const first = samples.slice(0, symbolLength);
    expect(Math.abs(countZeroCrossings(first) - 1440)).toBeLessThan(20);
  });

  it("matches the total length to the number of symbols", () => {
    const samples = generateBeacon("silverpush", "UG01", SAMPLE_RATE);
    expect(samples).toHaveLength(
      24 * msToSamples(SILVERPUSH.symbolMs, SAMPLE_RATE),
    );
  });

  it("keeps every sample inside -1 to 1", () => {
    for (const type of [
      "silverpush",
      "mosquito",
      "lisnr",
      "chirp",
      "tone",
    ] as const) {
      const samples = generateBeacon(type, "UG01", 44100);
      const peak = samples.reduce(
        (max, value) => Math.max(max, Math.abs(value)),
        0,
      );
      expect(peak).toBeLessThanOrEqual(1);
    }
  });

  it("starts and ends each symbol at zero to avoid clicks", () => {
    const samples = generateBeacon("silverpush", "UG01", SAMPLE_RATE);
    expect(samples[0]).toBe(0);
    expect(Math.abs(samples[samples.length - 1])).toBeLessThan(1e-6);
  });
});
