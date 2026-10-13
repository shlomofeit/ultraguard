import { create } from "zustand";
import type { EventType } from "../types/event";
import type { SuspicionReason } from "../listener/suspicion";

export const TOAST_LIFE_MS = 6000;
export const MAX_TOASTS = 3;

export interface SuspicionToast {
  id: string;
  kind: "suspicion";
  type: EventType;
  reason: SuspicionReason;
  peakFreqHz: number;
  payload: string | null;
}

export interface MessageToast {
  id: string;
  kind: "message";
  text: string;
}

export type Toast = SuspicionToast | MessageToast;

interface ToastStore {
  toasts: Toast[];
  setToast: (toast: Omit<SuspicionToast, "id" | "kind">) => void;
  setMessageToast: (text: string) => void;
  removeToast: (id: string) => void;
}

const addToast = (
  set: (update: (state: ToastStore) => Partial<ToastStore>) => void,
  toast: Toast,
) => {
  set((state) => ({ toasts: [toast, ...state.toasts].slice(0, MAX_TOASTS) }));
  setTimeout(() => {
    set((state) => ({
      toasts: state.toasts.filter((item) => item.id !== toast.id),
    }));
  }, TOAST_LIFE_MS);
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  setToast: (toast) =>
    addToast(set, { ...toast, id: crypto.randomUUID(), kind: "suspicion" }),

  setMessageToast: (text) =>
    addToast(set, { id: crypto.randomUUID(), kind: "message", text }),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((item) => item.id !== id),
    })),
}));
