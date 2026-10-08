export type EventType =
  | "silverpush"
  | "lisnr"
  | "mosquito"
  | "chirp"
  | "tone"
  | "noise"
  | "unknown";

export type AudioState = "running" | "suspended" | "closed";

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
}

export interface Event extends EventInput {
  deviceId: string;
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
