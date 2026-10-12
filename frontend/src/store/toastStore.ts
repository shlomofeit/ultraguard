import { create } from "zustand";
import type { EventType } from "../types/event";
import type { SuspicionReason } from "../listener/suspicion";

export const TOAST_LIFE_MS = 6000;
export const MAX_TOASTS = 3;

export interface Toast {
  id: string;
  type: EventType;
  reason: SuspicionReason;
  peakFreqHz: number;
  payload: string | null;
}

interface ToastStore {
  toasts: Toast[];
  setToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  setToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [{ ...toast, id }, ...state.toasts].slice(0, MAX_TOASTS),
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((item) => item.id !== id),
      }));
    }, TOAST_LIFE_MS);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((item) => item.id !== id),
    })),
}));
