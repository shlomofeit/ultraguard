import { create } from "zustand";
import type { Detection } from "../listener/detector";
import { startCapture, type Capture } from "../listener/capture";
import { createPipeline } from "../listener/pipeline";
import { getErrorDetails } from "../utils/getErrorDetails";

export const MAX_DETECTIONS = 50;

interface ListenerStore {
  isListening: boolean;
  isLoading: boolean;
  error: string | null;
  sampleRate: number | null;
  startedAtMs: number | null;
  detections: Detection[];
  setStartListening: () => void;
  setStopListening: () => void;
  removeDetections: () => void;
}

let capture: Capture | null = null;

export const useListenerStore = create<ListenerStore>((set, get) => ({
  isListening: false,
  isLoading: false,
  error: null,
  sampleRate: null,
  startedAtMs: null,
  detections: [],

  setStartListening: async () => {
    if (get().isListening) {
      return;
    }
    set({ isLoading: true, error: null });
    try {
      let pipeline: ReturnType<typeof createPipeline> | null = null;
      capture = await startCapture((frame) => {
        const detection = pipeline?.processFrame(frame);
        if (detection) {
          set((state) => ({
            detections: [detection, ...state.detections].slice(
              0,
              MAX_DETECTIONS,
            ),
          }));
        }
      });
      pipeline = createPipeline(capture.sampleRate);
      set({
        isListening: true,
        isLoading: false,
        sampleRate: capture.sampleRate,
        startedAtMs: Date.now(),
      });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorDetails(err, "לא הצלחתי להפעיל את המיקרופון"),
      });
    }
  },

  setStopListening: () => {
    capture?.stop();
    capture = null;
    set({ isListening: false });
  },

  removeDetections: () => set({ detections: [] }),
}));
