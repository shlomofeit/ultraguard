import { create } from "zustand";
import { io } from "socket.io-client";
import { startCapture, type Capture } from "../listener/capture";
import { createSender, type Sender } from "../listener/sender";
import { createSuspicionTracker } from "../listener/suspicion";
import { useToastStore } from "./toastStore";
import { getErrorDetails } from "../utils/getErrorDetails";
import {
  createPipeline,
  getDetectionType,
  toEventInput,
  toSighting,
  type CheckedDetection,
} from "../listener/pipeline";

const LISTENER_URL = `${import.meta.env.VITE_API_URL}/listener`;

export const MAX_DETECTIONS = 50;
export const HEARTBEAT_MS = 10000;
export const DEAF_CHECK_FRAMES = 50;

const DEVICE_KEY_STORAGE = "ultraguard.deviceKey";

const readDeviceKey = (): string => {
  try {
    return localStorage.getItem(DEVICE_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
};

interface ListenerStore {
  isListening: boolean;
  isLoading: boolean;
  error: string | null;
  sampleRate: number | null;
  analyser: AnalyserNode | null;
  startedAtMs: number | null;
  detections: CheckedDetection[];
  isMicDeaf: boolean;
  isConnected: boolean;
  queueSize: number;
  isRejected: boolean;
  deviceKey: string;
  setDeviceKey: (deviceKey: string) => void;
  setStartListening: () => void;
  setStopListening: () => void;
  removeDetections: () => void;
}

let capture: Capture | null = null;
let sender: Sender | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  heartbeatTimer = null;
};

export const useListenerStore = create<ListenerStore>((set, get) => ({
  isListening: false,
  isLoading: false,
  error: null,
  sampleRate: null,
  analyser: null,
  startedAtMs: null,
  detections: [],
  isMicDeaf: false,
  isConnected: false,
  isRejected: false,
  deviceKey: readDeviceKey(),
  queueSize: 0,

  setDeviceKey: (deviceKey) => {
    localStorage.setItem(DEVICE_KEY_STORAGE, deviceKey);
    set({ deviceKey, isRejected: false });
  },

  setStartListening: async () => {
    const { isListening, deviceKey } = get();
    if (isListening) {
      return;
    }
    if (!deviceKey) {
      set({ error: "צריך להזין מפתח מכשיר לפני שמתחילים להאזין" });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      let pipeline: ReturnType<typeof createPipeline> | null = null;
      const startedAtMs = Date.now();
      const tracker = createSuspicionTracker();
      let framesProcessed = 0;
      sender = createSender(
        io(LISTENER_URL, { auth: { deviceKey } }),
        (status) => set(status),
      );
      capture = await startCapture((frame) => {
        framesProcessed++;
        const detection = pipeline?.processFrame(frame);
        if (pipeline && framesProcessed % DEAF_CHECK_FRAMES === 0) {
          const isMicDeaf = pipeline.isMicDeaf();
          if (isMicDeaf !== get().isMicDeaf) {
            set({ isMicDeaf });
          }
        }
        if (!detection || !capture) {
          return;
        }
        const suspicion = detection.isBeacon
          ? tracker.check(toSighting(detection))
          : null;
        set((state) => ({
          detections: [{ ...detection, suspicion }, ...state.detections].slice(
            0,
            MAX_DETECTIONS,
          ),
        }));
        if (suspicion) {
          const { type } = getDetectionType(detection);
          useToastStore.getState().setToast({
            type,
            reason: suspicion,
            peakFreqHz: detection.peakFreqHz,
            payload: detection.payload,
          });
          sender?.sendEvent(
            toEventInput(detection, startedAtMs, capture.sampleRate),
          );
        }
      });
      pipeline = createPipeline(capture.sampleRate);
      heartbeatTimer = setInterval(() => {
        if (!capture) {
          return;
        }
        sender?.sendHeartbeat({
          sentAt: new Date().toISOString(),
          framesProcessed,
          audioState: capture.getAudioState(),
          isMicLive: capture.isMicLive(),
          queueSize: get().queueSize,
        });
      }, HEARTBEAT_MS);
      set({
        isListening: true,
        isLoading: false,
        sampleRate: capture.sampleRate,
        analyser: capture.analyser,
        startedAtMs,
      });
    } catch (err) {
      sender?.stop();
      sender = null;
      set({
        isLoading: false,
        error: getErrorDetails(err, "לא הצלחתי להפעיל את המיקרופון"),
      });
    }
  },

  setStopListening: () => {
    stopHeartbeat();
    capture?.stop();
    capture = null;
    sender?.stop();
    sender = null;
    set({
      isListening: false,
      isMicDeaf: false,
      isConnected: false,
      queueSize: 0,
      analyser: null,
    });
  },

  removeDetections: () => set({ detections: [] }),
}));
