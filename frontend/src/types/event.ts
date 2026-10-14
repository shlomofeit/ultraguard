import type { SuspicionReason } from "../listener/suspicion";

export type EventType =
  | "silverpush"
  | "lisnr"
  | "mosquito"
  | "chirp"
  | "tone"
  | "noise"
  | "unknown";

export type AudioState = "running" | "suspended" | "closed";

export interface EventFeatures {
  meanEntropy: number;
  isStable: boolean;
  isSweep: boolean;
  mainPeaksHz: number[];
  meanFrameFreqs: number;
  switchRate: number;
  decodedType: EventType | null;
  suspicion: SuspicionReason | null;
}

export interface EventInput {
  id: string;
  startedAt: string;
  durationMs: number;
  type: EventType;
  confidence: number;
  peakFreqHz: number;
  freqsHz: number[];
  snrDb: number;
  payload: string | null;
  sampleRate: number;
  features?: EventFeatures;
}

export interface Event extends EventInput {
  deviceId: string | null;
  roomId: string;
  receivedAt: string;
  isKnownSource: boolean;
}

export interface HeartbeatInput {
  sentAt: string;
  framesProcessed: number;
  audioState: AudioState;
  isMicLive: boolean;
  queueSize: number;
}

export interface SocketAck {
  success: boolean;
  message?: string;
}

export interface EventFilter {
  type: EventType | "all";
  rangeHours: number;
}
