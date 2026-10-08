import { z } from "zod";

export const EVENT_TYPES = [
  "silverpush",
  "lisnr",
  "mosquito",
  "chirp",
  "tone",
  "noise",
  "unknown",
];

export const AUDIO_STATES = ["running", "suspended", "closed"];

const MIN_FREQ_HZ = 10000;
const MAX_FREQ_HZ = 24000;
const MAX_DURATION_MS = 60000;
const MAX_FREQS = 16;
const MAX_PAYLOAD_LENGTH = 256;

const freqSchema = z
  .number("Frequency must be a number")
  .min(MIN_FREQ_HZ, "Frequency must be at least 10000 Hz")
  .max(MAX_FREQ_HZ, "Frequency must be at most 24000 Hz");

export const eventSchema = z.object({
  id: z.uuid("id must be a valid UUID"),
  startedAt: z.iso.datetime("startedAt must be an ISO date"),
  durationMs: z
    .number("durationMs must be a number")
    .int("durationMs must be a whole number")
    .positive("durationMs must be positive")
    .max(MAX_DURATION_MS, "durationMs must be at most 60000"),
  type: z.enum(EVENT_TYPES, "type is not a known event type"),
  confidence: z
    .number("confidence must be a number")
    .min(0, "confidence must be at least 0")
    .max(1, "confidence must be at most 1"),
  peakFreqHz: freqSchema,
  freqsHz: z
    .array(freqSchema, "freqsHz must be an array")
    .min(1, "freqsHz must have at least one frequency")
    .max(MAX_FREQS, "freqsHz must have at most 16 frequencies"),
  snrDb: z.number("snrDb must be a number"),
  payload: z
    .string("payload must be a string or null")
    .max(MAX_PAYLOAD_LENGTH, "payload must be at most 256 characters")
    .nullable(),
  sampleRate: z
    .number("sampleRate must be a number")
    .int("sampleRate must be a whole number")
    .positive("sampleRate must be positive"),
});

export const heartbeatSchema = z.object({
  sentAt: z.iso.datetime("sentAt must be an ISO date"),
  framesProcessed: z
    .number("framesProcessed must be a number")
    .int("framesProcessed must be a whole number")
    .min(0, "framesProcessed must be at least 0"),
  audioState: z.enum(AUDIO_STATES, "audioState is not a known state"),
  isMicLive: z.boolean("isMicLive must be true or false"),
  queueSize: z
    .number("queueSize must be a number")
    .int("queueSize must be a whole number")
    .min(0, "queueSize must be at least 0"),
});
