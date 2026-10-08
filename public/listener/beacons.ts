import type { BeaconType } from "../types/beacon";

export const LEVEL = 0.8;
export const RAMP_MS = 5;
export const RAMP_MAX_RATIO = 0.2;

export const SILVERPUSH = {
  freqsHz: [18000, 18500, 19000, 19500],
  symbolMs: 40,
  preamble: [0, 3, 0, 3],
  payloadBytes: 4,
  repeatMs: 3000,
};

export const MOSQUITO = {
  zeroHz: 19500,
  oneHz: 20500,
  bitMs: 10,
  preambleByte: 0xaa,
  maxBytes: 16,
  repeatMs: 3000,
};

export const LISNR = {
  freqsHz: [17000, 17250, 17500, 17750, 18000, 18250, 18500, 18750],
  symbolMs: 60,
  payloadBytes: 4,
  repeatMs: 3000,
};

export const CHIRP = {
  fromHz: 18000,
  toHz: 20000,
  durationMs: 300,
  repeatMs: 2000,
};

export const TONE = {
  freqHz: 19000,
  durationMs: 1000,
  repeatMs: 1000,
};

export const BEACON_LABELS: Record<BeaconType, string> = {
  silverpush: "בסגנון SilverPush (4 צלילים בקפיצות)",
  mosquito: "בסגנון MOSQUITO (2 צלילים, מהיר)",
  lisnr: "בסגנון LISNR (8 צלילים במקביל)",
  chirp: "צליל עולה (chirp)",
  tone: "צליל רציף (כמו דוחה מזיקים)",
};

export const TEXT_BEACONS: BeaconType[] = ["silverpush", "mosquito", "lisnr"];

export const getRepeatMs = (type: BeaconType): number => {
  if (type === "silverpush") return SILVERPUSH.repeatMs;
  if (type === "mosquito") return MOSQUITO.repeatMs;
  if (type === "lisnr") return LISNR.repeatMs;
  if (type === "chirp") return CHIRP.repeatMs;
  return TONE.repeatMs;
};
