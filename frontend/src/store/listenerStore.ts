import { create } from "zustand";
import { io } from "socket.io-client";
import { startCapture, type Capture } from "../listener/capture";
import { createSender, type Sender } from "../listener/sender";
import { getErrorDetails } from "../utils/getErrorDetails";
import {
  createPipeline,
  toEventInput,
  type PipelineDetection,
} from "../listener/pipeline";

const LISTENER_URL = `${import.meta.env.VITE_API_URL}/listener`;

export const MAX_DETECTIONS = 50;

interface ListenerStore {
  isListening: boolean;
  isLoading: boolean;
  error: string | null;
  sampleRate: number | null;
  startedAtMs: number | null;
  detections: PipelineDetection[];
  isConnected: boolean;
  queueSize: number;
  setStartListening: () => void;
  setStopListening: () => void;
  removeDetections: () => void;
}

let capture: Capture | null = null;
let sender: Sender | null = null;

export const useListenerStore = create<ListenerStore>((set, get) => ({
  isListening: false,
  isLoading: false,
  error: null,
  sampleRate: null,
  startedAtMs: null,
  detections: [],
  isConnected: false,
  queueSize: 0,

  setStartListening: async () => {
    if (get().isListening) {
      return;
    }
    set({ isLoading: true, error: null });
    try {
      let pipeline: ReturnType<typeof createPipeline> | null = null;
      const startedAtMs = Date.now();
      sender = createSender(io(LISTENER_URL), (status) => set(status));
      capture = await startCapture((frame) => {
        const detection = pipeline?.processFrame(frame);
        if (!detection || !capture) {
          return;
        }
        set((state) => ({
          detections: [detection, ...state.detections].slice(0, MAX_DETECTIONS),
        }));
        if (detection.isBeacon) {
          sender?.sendEvent(
            toEventInput(detection, startedAtMs, capture.sampleRate),
          );
        }
      });
      pipeline = createPipeline(capture.sampleRate);
      set({
        isListening: true,
        isLoading: false,
        sampleRate: capture.sampleRate,
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
    capture?.stop();
    capture = null;
    sender?.stop();
    sender = null;
    set({ isListening: false, isConnected: false, queueSize: 0 });
  },

  removeDetections: () => set({ detections: [] }),
}));
