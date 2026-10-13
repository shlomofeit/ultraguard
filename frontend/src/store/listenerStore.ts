import { create } from "zustand";
import { io } from "socket.io-client";
import { startCapture, type Capture } from "../listener/capture";
import { createSender, type Sender } from "../listener/sender";
import { createSuspicionTracker } from "../listener/suspicion";
import { useToastStore } from "./toastStore";
import { getErrorDetails } from "../utils/getErrorDetails";
import { getErrorStatus } from "../utils/getErrorStatus";
import { verifyDeviceKey } from "../api/devices.api";
import type { DeviceKeyInfo, DeviceKeyStatus } from "../types/device";
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

const getKeyError = (err: unknown): string => {
  const status = getErrorStatus(err);
  if (status === 404) {
    return "המפתח לא נמצא. בדוק אותו מול המנהל.";
  }
  if (status === 403) {
    return "המפתח הזה בוטל. בקש מהמנהל מפתח חדש.";
  }
  if (status === 429) {
    return "יותר מדי ניסיונות. נסה שוב בעוד כמה דקות.";
  }
  return "לא הצלחתי לבדוק את המפתח. נסה שוב.";
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
  keyStatus: DeviceKeyStatus;
  keyInfo: DeviceKeyInfo | null;
  keyError: string | null;
  setDeviceKey: (deviceKey: string) => void;
  setCheckedDeviceKey: () => void;
  removeDeviceKey: () => void;
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
  keyStatus: readDeviceKey() ? "unchecked" : "none",
  keyInfo: null,
  keyError: null,
  queueSize: 0,

  setDeviceKey: async (deviceKey) => {
    set({ keyStatus: "checking", keyError: null });
    try {
      const keyInfo = await verifyDeviceKey(deviceKey);
      localStorage.setItem(DEVICE_KEY_STORAGE, deviceKey);
      set({ deviceKey, keyInfo, keyStatus: "valid", isRejected: false });
    } catch (err) {
      set({ keyStatus: "none", keyError: getKeyError(err) });
    }
  },

  setCheckedDeviceKey: async () => {
    const { deviceKey, keyStatus } = get();
    if (!deviceKey || keyStatus !== "unchecked") {
      return;
    }
    set({ keyStatus: "checking" });
    try {
      const keyInfo = await verifyDeviceKey(deviceKey);
      set({ keyInfo, keyStatus: "valid" });
    } catch (err) {
      const status = getErrorStatus(err);
      const isDead = status === 403 || status === 404;
      set({ keyStatus: isDead ? "revoked" : "unchecked" });
    }
  },

  removeDeviceKey: () => {
    localStorage.removeItem(DEVICE_KEY_STORAGE);
    set({
      deviceKey: "",
      keyStatus: "none",
      keyInfo: null,
      keyError: null,
      isRejected: false,
    });
  },

  setStartListening: async () => {
    const { isListening, deviceKey, keyStatus } = get();
    if (isListening) {
      return;
    }
    if (!deviceKey) {
      set({ error: "צריך להזין מפתח מכשיר לפני שמתחילים להאזין" });
      return;
    }
    if (keyStatus === "revoked") {
      set({ error: "המפתח של המכשיר הזה כבר לא תקף. צריך להזין מפתח חדש" });
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
        (status) => {
          if (!status.isRejected) {
            set(status);
            return;
          }
          set({ ...status, keyStatus: "revoked" });
          get().setStopListening();
        },
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
