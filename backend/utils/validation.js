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
export const DEVICE_KINDS = ["browser", "python"];

export const USER_ROLES = ["admin", "viewer"];

const MIN_FREQ_HZ = 10000;
const MAX_FREQ_HZ = 24000;
const MAX_DURATION_MS = 60000;
const MAX_FREQS = 16;
const MAX_PAYLOAD_LENGTH = 256;
const DEFAULT_EVENTS_LIMIT = 50;
const MAX_EVENTS_LIMIT = 200;

const freqSchema = z
  .number("Frequency must be a number")
  .min(MIN_FREQ_HZ, `Frequency must be at least ${MIN_FREQ_HZ} Hz`)
  .max(MAX_FREQ_HZ, `Frequency must be at most ${MAX_FREQ_HZ} Hz`);

export const createEventSchema = z.object({
  id: z.uuid("id must be a valid UUID"),
  startedAt: z.iso.datetime("startedAt must be an ISO date"),
  durationMs: z
    .number("durationMs must be a number")
    .int("durationMs must be a whole number")
    .positive("durationMs must be positive")
    .max(MAX_DURATION_MS, `durationMs must be at most ${MAX_DURATION_MS}`),
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
    .max(
      MAX_PAYLOAD_LENGTH,
      `payload must be at most ${MAX_PAYLOAD_LENGTH} characters`,
    )
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

export const getEventsSchema = z.object({
  roomId: z.uuid("roomId must be a valid UUID").optional(),
  type: z.enum(EVENT_TYPES, "type is not a known event type").optional(),
  from: z.iso.datetime("from must be an ISO date").optional(),
  to: z.iso.datetime("to must be an ISO date").optional(),
  limit: z.coerce
    .number("limit must be a number")
    .int("limit must be a whole number")
    .min(1, "limit must be at least 1")
    .max(MAX_EVENTS_LIMIT, `limit must be at most ${MAX_EVENTS_LIMIT}`)
    .default(DEFAULT_EVENTS_LIMIT),
});

export const registerSchema = z.object({
  name: z
    .string("name must be a string")
    .trim()
    .min(2, "name must be at least 2 characters")
    .max(50, "name must be at most 50 characters"),
  email: z.email("email is not valid").toLowerCase(),
  password: z
    .string("password must be a string")
    .min(8, "password must be at least 8 characters")
    .max(72, "password must be at most 72 characters"),
});

export const loginSchema = z.object({
  email: z.email("email is not valid").toLowerCase(),
  password: z
    .string("password must be a string")
    .min(1, "password is required"),
});

export const roomSchema = z.object({
  name: z
    .string("name must be a string")
    .trim()
    .min(2, "name must be at least 2 characters")
    .max(50, "name must be at most 50 characters"),
});

export const updateUserSchema = z.object({
  name: z
    .string("name must be a string")
    .trim()
    .min(2, "name must be at least 2 characters")
    .max(50, "name must be at most 50 characters"),
  role: z.enum(USER_ROLES, "role must be admin or viewer"),
  roomIds: z.array(
    z.uuid("every room id must be a valid UUID"),
    "roomIds must be a list",
  ),
});

export const createDeviceSchema = z.object({
  roomId: z.uuid("roomId must be a valid UUID"),
  name: z
    .string("name must be a string")
    .trim()
    .min(2, "name must be at least 2 characters")
    .max(50, "name must be at most 50 characters"),
  kind: z.enum(DEVICE_KINDS, "kind must be browser or python"),
});

export const updateDeviceSchema = createDeviceSchema.omit({ kind: true });

export const verifyDeviceKeySchema = z.object({
  deviceKey: z
    .string("deviceKey must be a string")
    .trim()
    .min(1, "deviceKey is required")
    .max(200, "deviceKey is too long"),
});

export function validateSchema(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const issue = result.error.issues[0];
    const error = new Error(`${issue.path.join(".")}: ${issue.message}`);
    error.status = 400;
    throw error;
  }

  return result.data;
}
