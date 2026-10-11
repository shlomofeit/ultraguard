import type { EventType } from "../types/event";
import { applyHann, goertzelPower } from "./dsp";
import { LISNR, MOSQUITO, SILVERPUSH } from "./beacons";
import { checksum } from "./beaconGenerator";

export const SEARCH_MS = 150;
export const SEARCH_STEP_MS = 1;
export const WINDOW_SHARE = 0.7;
export const MIN_PREAMBLE_SCORE = 0.7;
export const PLATEAU_SHARE = 0.03;
export const LISNR_BIT_RATIO = 0.1;
export const MIN_LISNR_EVENNESS = 0.3;
export const MAX_TEXT_BEACON_MS = (MOSQUITO.maxBytes + 3) * 8 * MOSQUITO.bitMs;

type TextBeaconType = "silverpush" | "mosquito" | "lisnr";

export interface DecodeResult {
  type: TextBeaconType;
  payload: string;
}

const TEXT_TYPES: TextBeaconType[] = ["silverpush", "mosquito", "lisnr"];

export const canHaveText = (type: EventType): boolean =>
  type === "unknown" || TEXT_TYPES.some((textType) => textType === type);

const msToSamples = (ms: number, sampleRate: number) =>
  Math.round((ms * sampleRate) / 1000);

const measureTones = (
  samples: Float32Array,
  start: number,
  symbolLength: number,
  freqs: number[],
  sampleRate: number,
): number[] => {
  const windowLength = Math.round(symbolLength * WINDOW_SHARE);
  const from = start + Math.round((symbolLength - windowLength) / 2);
  if (from < 0 || from + windowLength > samples.length) {
    return freqs.map(() => 0);
  }
  const windowed = applyHann(samples.subarray(from, from + windowLength));
  return freqs.map((freq) => goertzelPower(windowed, freq, sampleRate));
};

const getShare = (powers: number[], index: number) => {
  const total = powers.reduce((sum, power) => sum + power, 0);
  return total === 0 ? 0 : powers[index] / total;
};

const findBestOffset = (
  sampleRate: number,
  scoreAt: (offset: number) => number,
): { offset: number; score: number } => {
  const step = msToSamples(SEARCH_STEP_MS, sampleRate);
  const last = msToSamples(SEARCH_MS, sampleRate);
  const scores: number[] = [];
  for (let offset = 0; offset <= last; offset += step) {
    scores.push(scoreAt(offset));
  }

  const limit = Math.max(...scores) * (1 - PLATEAU_SHARE);
  const first = scores.findIndex((score) => score >= limit);
  let lastIndex = first;
  while (lastIndex < scores.length - 1 && scores[lastIndex + 1] >= limit) {
    lastIndex++;
  }
  const center = Math.round((first + lastIndex) / 2);
  return { offset: center * step, score: scores[center] };
};

export const bytesToText = (bytes: number[]): string | null => {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) {
    end--;
  }
  if (end === 0) {
    return null;
  }
  return new TextDecoder().decode(new Uint8Array(bytes.slice(0, end)));
};

const checkBytes = (bytes: number[]): string | null => {
  const data = bytes.slice(0, -1);
  if (checksum(data) !== bytes[bytes.length - 1]) {
    return null;
  }
  return bytesToText(data);
};

const decodeSilverpush = (samples: Float32Array, sampleRate: number) => {
  const symbolLength = msToSamples(SILVERPUSH.symbolMs, sampleRate);
  const readSymbol = (start: number) =>
    measureTones(samples, start, symbolLength, SILVERPUSH.freqsHz, sampleRate);

  const { offset, score } = findBestOffset(sampleRate, (start) => {
    const shares = SILVERPUSH.preamble.map((symbol, i) =>
      getShare(readSymbol(start + i * symbolLength), symbol),
    );
    return shares.reduce((sum, share) => sum + share, 0) / shares.length;
  });
  if (score < MIN_PREAMBLE_SCORE) {
    return null;
  }

  const dataStart = offset + SILVERPUSH.preamble.length * symbolLength;
  const bytes: number[] = [];
  for (let byte = 0; byte <= SILVERPUSH.payloadBytes; byte++) {
    let value = 0;
    for (let i = 0; i < 4; i++) {
      const powers = readSymbol(dataStart + (byte * 4 + i) * symbolLength);
      value = (value << 2) | powers.indexOf(Math.max(...powers));
    }
    bytes.push(value);
  }
  return checkBytes(bytes);
};

const decodeMosquito = (samples: Float32Array, sampleRate: number) => {
  const bitLength = msToSamples(MOSQUITO.bitMs, sampleRate);
  const freqs = [MOSQUITO.zeroHz, MOSQUITO.oneHz];
  const readBit = (start: number) => {
    const powers = measureTones(samples, start, bitLength, freqs, sampleRate);
    return getShare(powers, 1);
  };
  const readByte = (start: number) => {
    let value = 0;
    for (let i = 0; i < 8; i++) {
      value = (value << 1) | (readBit(start + i * bitLength) > 0.5 ? 1 : 0);
    }
    return value;
  };

  const { offset, score } = findBestOffset(sampleRate, (start) => {
    let total = 0;
    for (let i = 0; i < 8; i++) {
      const expected = (MOSQUITO.preambleByte >> (7 - i)) & 1;
      const share = readBit(start + i * bitLength);
      total += expected === 1 ? share : 1 - share;
    }
    return total / 8;
  });
  if (score < MIN_PREAMBLE_SCORE) {
    return null;
  }

  const byteLength = 8 * bitLength;
  const length = readByte(offset + byteLength);
  if (length === 0 || length > MOSQUITO.maxBytes) {
    return null;
  }
  const bytes: number[] = [];
  for (let i = 0; i <= length; i++) {
    bytes.push(readByte(offset + (2 + i) * byteLength));
  }
  return checkBytes(bytes);
};

const decodeLisnr = (samples: Float32Array, sampleRate: number) => {
  const symbolLength = msToSamples(LISNR.symbolMs, sampleRate);
  const readSymbol = (start: number) =>
    measureTones(samples, start, symbolLength, LISNR.freqsHz, sampleRate);

  const { offset } = findBestOffset(sampleRate, (start) =>
    Math.min(...readSymbol(start)),
  );
  const preamble = readSymbol(offset);
  if (Math.min(...preamble) < Math.max(...preamble) * MIN_LISNR_EVENNESS) {
    return null;
  }

  const bytes: number[] = [];
  for (let byte = 1; byte <= LISNR.payloadBytes + 1; byte++) {
    const powers = readSymbol(offset + byte * symbolLength);
    let value = 0;
    powers.forEach((power, bit) => {
      if (power >= preamble[bit] * LISNR_BIT_RATIO) {
        value |= 1 << bit;
      }
    });
    bytes.push(value);
  }
  return checkBytes(bytes);
};

const DECODERS: Record<
  TextBeaconType,
  (samples: Float32Array, sampleRate: number) => string | null
> = {
  silverpush: decodeSilverpush,
  mosquito: decodeMosquito,
  lisnr: decodeLisnr,
};

export const decodeBeacon = (
  samples: Float32Array,
  sampleRate: number,
  guessedType: EventType,
): DecodeResult | null => {
  if (!canHaveText(guessedType)) {
    return null;
  }
  const order = [
    ...TEXT_TYPES.filter((type) => type === guessedType),
    ...TEXT_TYPES.filter((type) => type !== guessedType),
  ];
  for (const type of order) {
    const payload = DECODERS[type](samples, sampleRate);
    if (payload) {
      return { type, payload };
    }
  }
  return null;
};
