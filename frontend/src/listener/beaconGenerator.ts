import type { BeaconType, Segment } from "../types/beacon";
import {
  CHIRP,
  LEVEL,
  LISNR,
  MOSQUITO,
  RAMP_MAX_RATIO,
  RAMP_MS,
  SILVERPUSH,
  TONE,
} from "./beacons";

export const textToBytes = (text: string, length?: number): number[] => {
  const bytes = Array.from(new TextEncoder().encode(text));
  if (length === undefined) {
    return bytes;
  }
  const fixed = bytes.slice(0, length);
  while (fixed.length < length) {
    fixed.push(0);
  }
  return fixed;
};

export const checksum = (bytes: number[]): number => {
  return bytes.reduce((sum, byte) => sum + byte, 0) % 256;
};

export const byteToSymbols = (byte: number): number[] => {
  return [(byte >> 6) & 3, (byte >> 4) & 3, (byte >> 2) & 3, byte & 3];
};

export const byteToBits = (byte: number): number[] => {
  const bits: number[] = [];
  for (let i = 7; i >= 0; i--) {
    bits.push((byte >> i) & 1);
  }
  return bits;
};

const buildSilverpush = (text: string): Segment[] => {
  const bytes = textToBytes(text, SILVERPUSH.payloadBytes);
  const symbols = [
    ...SILVERPUSH.preamble,
    ...[...bytes, checksum(bytes)].flatMap(byteToSymbols),
  ];
  return symbols.map((symbol) => ({
    kind: "tones",
    freqsHz: [SILVERPUSH.freqsHz[symbol]],
    durationMs: SILVERPUSH.symbolMs,
  }));
};

const buildMosquito = (text: string): Segment[] => {
  const data = textToBytes(text).slice(0, MOSQUITO.maxBytes);
  const bytes = [MOSQUITO.preambleByte, data.length, ...data, checksum(data)];
  return bytes.flatMap(byteToBits).map((bit) => ({
    kind: "tones",
    freqsHz: [bit === 1 ? MOSQUITO.oneHz : MOSQUITO.zeroHz],
    durationMs: MOSQUITO.bitMs,
  }));
};

const buildLisnr = (text: string): Segment[] => {
  const bytes = textToBytes(text, LISNR.payloadBytes);
  const preamble: Segment = {
    kind: "tones",
    freqsHz: LISNR.freqsHz,
    durationMs: LISNR.symbolMs,
  };
  const symbols: Segment[] = [...bytes, checksum(bytes)].map((byte) => ({
    kind: "tones",
    freqsHz: LISNR.freqsHz.filter((_, i) => ((byte >> i) & 1) === 1),
    durationMs: LISNR.symbolMs,
  }));
  return [preamble, ...symbols];
};

export const buildSegments = (type: BeaconType, text: string): Segment[] => {
  if (type === "silverpush") return buildSilverpush(text);
  if (type === "mosquito") return buildMosquito(text);
  if (type === "lisnr") return buildLisnr(text);
  if (type === "chirp") {
    return [
      {
        kind: "sweep",
        fromHz: CHIRP.fromHz,
        toHz: CHIRP.toHz,
        durationMs: CHIRP.durationMs,
      },
    ];
  }
  return [
    { kind: "tones", freqsHz: [TONE.freqHz], durationMs: TONE.durationMs },
  ];
};

export const msToSamples = (ms: number, sampleRate: number): number => {
  return Math.round((ms * sampleRate) / 1000);
};

const getEnvelope = (i: number, length: number, rampLength: number): number => {
  if (rampLength === 0) {
    return 1;
  }
  return Math.min(1, i / rampLength, (length - 1 - i) / rampLength);
};

const renderSegment = (segment: Segment, sampleRate: number): Float32Array => {
  const length = msToSamples(segment.durationMs, sampleRate);
  const rampMs = Math.min(RAMP_MS, segment.durationMs * RAMP_MAX_RATIO);
  const rampLength = msToSamples(rampMs, sampleRate);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let value = 0;

    if (segment.kind === "sweep") {
      const durationSec = segment.durationMs / 1000;
      const slope = (segment.toHz - segment.fromHz) / durationSec;
      value = Math.sin(
        2 * Math.PI * (segment.fromHz * t + (slope * t * t) / 2),
      );
    } else if (segment.freqsHz.length > 0) {
      for (const freq of segment.freqsHz) {
        value += Math.sin(2 * Math.PI * freq * t);
      }
      value /= segment.freqsHz.length;
    }

    samples[i] = value * LEVEL * getEnvelope(i, length, rampLength);
  }

  return samples;
};

export const renderSegments = (
  segments: Segment[],
  sampleRate: number,
): Float32Array => {
  const parts = segments.map((segment) => renderSegment(segment, sampleRate));
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const samples = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    samples.set(part, offset);
    offset += part.length;
  }
  return samples;
};

export const generateBeacon = (
  type: BeaconType,
  text: string,
  sampleRate: number,
): Float32Array => {
  return renderSegments(buildSegments(type, text), sampleRate);
};

export const getDurationMs = (segments: Segment[]): number => {
  return segments.reduce((sum, segment) => sum + segment.durationMs, 0);
};
