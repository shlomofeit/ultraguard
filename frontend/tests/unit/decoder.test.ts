import { describe, expect, it } from "vitest";
import {
  bytesToText,
  decodeBeacon,
  isReadableText,
} from "../../src/listener/decoder";
import { generateBeacon } from "../../src/listener/beaconGenerator";
import { SILVERPUSH } from "../../src/listener/beacons";

const placeBeacon = (
  beacon: Float32Array,
  leadMs: number,
  sampleRate: number,
) => {
  const lead = Math.round((leadMs * sampleRate) / 1000);
  const samples = new Float32Array(lead + beacon.length + sampleRate / 5);
  samples.set(beacon, lead);
  for (let i = 0; i < samples.length; i++) {
    samples[i] += Math.sin(i * 12.9898) * 0.01;
  }
  return samples;
};

const addTone = (
  samples: Float32Array,
  freqHz: number,
  fromMs: number,
  level: number,
  sampleRate: number,
) => {
  const from = Math.round((fromMs * sampleRate) / 1000);
  const length = Math.round((SILVERPUSH.symbolMs * sampleRate) / 1000);
  for (let i = 0; i < length; i++) {
    samples[from + i] +=
      Math.sin((2 * Math.PI * freqHz * i) / sampleRate) * level;
  }
};

describe("bytesToText", () => {
  it("drops the zero padding at the end", () => {
    expect(bytesToText([72, 105, 0, 0])).toBe("Hi");
  });

  it("returns null when there is no text", () => {
    expect(bytesToText([0, 0, 0, 0])).toBeNull();
  });
});

describe("isReadableText", () => {
  it("accepts English and Hebrew", () => {
    expect(isReadableText("UG01")).toBe(true);
    expect(isReadableText("חדר 7")).toBe(true);
  });

  it("accepts a letter cut in half at the end", () => {
    expect(isReadableText("aש\ufffd")).toBe(true);
  });

  it("rejects control characters and broken letters in the middle", () => {
    expect(isReadableText("U\u0003G")).toBe(false);
    expect(isReadableText("U\ufffdG")).toBe(false);
  });
});

describe("decodeBeacon", () => {
  const cases = [
    { type: "silverpush" as const, text: "UG01", expected: "UG01" },
    { type: "silverpush" as const, text: "1234", expected: "1234" },
    { type: "mosquito" as const, text: "Room 7 ok", expected: "Room 7 ok" },
    { type: "lisnr" as const, text: "Hi", expected: "Hi" },
    { type: "lisnr" as const, text: "Room 7", expected: "Room" },
  ];

  for (const sampleRate of [44100, 48000]) {
    for (const { type, text, expected } of cases) {
      it(`reads ${type} "${text}" at ${sampleRate} Hz`, () => {
        for (const leadMs of [10, 60, 120]) {
          const beacon = generateBeacon(type, text, sampleRate);
          const samples = placeBeacon(beacon, leadMs, sampleRate);
          expect(decodeBeacon(samples, sampleRate, type)).toEqual({
            type,
            payload: expected,
          });
        }
      });
    }
  }

  it("finds the text and the real type when the guess is wrong", () => {
    const beacon = generateBeacon("lisnr", "Hi", 44100);
    const samples = placeBeacon(beacon, 60, 44100);
    expect(decodeBeacon(samples, 44100, "mosquito")).toEqual({
      type: "lisnr",
      payload: "Hi",
    });
    expect(decodeBeacon(samples, 44100, "unknown")).toEqual({
      type: "lisnr",
      payload: "Hi",
    });
  });

  describe("silverpush with an echo on one symbol", () => {
    const sampleRate = 48000;
    const leadMs = 60;
    const lastSymbolMs =
      leadMs + (SILVERPUSH.preamble.length + 15) * SILVERPUSH.symbolMs;

    const withEcho = (level: number) => {
      const samples = placeBeacon(
        generateBeacon("silverpush", "UG01", sampleRate),
        leadMs,
        sampleRate,
      );
      addTone(samples, SILVERPUSH.freqsHz[0], lastSymbolMs, level, sampleRate);
      return samples;
    };

    it("recovers when the wrong tone is only slightly louder", () => {
      expect(decodeBeacon(withEcho(0.85), sampleRate, "silverpush")).toEqual({
        type: "silverpush",
        payload: "UG01",
      });
    });

    it("does not guess when the wrong tone is clearly louder", () => {
      expect(decodeBeacon(withEcho(2), sampleRate, "silverpush")).toBeNull();
    });
  });

  it("returns null for a beacon without text", () => {
    const beacon = generateBeacon("tone", "", 44100);
    const samples = placeBeacon(beacon, 60, 44100);
    expect(decodeBeacon(samples, 44100, "silverpush")).toBeNull();
    expect(decodeBeacon(samples, 44100, "mosquito")).toBeNull();
    expect(decodeBeacon(samples, 44100, "tone")).toBeNull();
  });
});
