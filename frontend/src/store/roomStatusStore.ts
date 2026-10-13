import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import type { RoomStatus } from "../types/room";
import type { Alert } from "../types/alert";
import { getRoomsStatus } from "../api/rooms.api";
import { getAlerts, markAlertRead } from "../api/alerts.api";
import { refreshSession } from "../api/auth.api";
import { LIVE_ALERT, LIVE_ROOM_STATUS } from "../utils/socketEvents";
import { getErrorDetails } from "../utils/getErrorDetails";
import { useToastStore } from "./toastStore";

const LIVE_URL = `${import.meta.env.VITE_API_URL}/live`;

interface RoomStatusStore {
  statuses: RoomStatus[];
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  setRoomsStatus: () => void;
  setStatusLive: () => void;
  setStopStatusLive: () => void;
  setAlertRead: (id: string) => void;
  setAllAlertsRead: () => void;
}

let socket: Socket | null = null;
let hasRetriedLogin = false;

export const useRoomStatusStore = create<RoomStatusStore>((set, get) => {
  const replaceAlert = (alert: Alert) =>
    set((state) => ({
      alerts: state.alerts.map((item) => (item.id === alert.id ? alert : item)),
    }));

  return {
    statuses: [],
    alerts: [],
    isLoading: false,
    error: null,

    setRoomsStatus: async () => {
      set({ isLoading: get().statuses.length === 0, error: null });
      try {
        const [statuses, alerts] = await Promise.all([
          getRoomsStatus(),
          getAlerts(),
        ]);
        set({ statuses, alerts, isLoading: false });
      } catch (err) {
        set({
          isLoading: false,
          error: getErrorDetails(err, "לא הצלחתי לטעון את מצב החדרים"),
        });
      }
    },

    setStatusLive: () => {
      if (socket) {
        return;
      }
      socket = io(LIVE_URL, { withCredentials: true, forceNew: true });
      socket.on("connect", () => {
        hasRetriedLogin = false;
        get().setRoomsStatus();
      });
      socket.on("connect_error", async () => {
        if (!socket || socket.active || hasRetriedLogin) {
          return;
        }
        hasRetriedLogin = true;
        try {
          await refreshSession();
          socket?.connect();
        } catch {
          set({ error: "החיבור לשרת נדחה. צריך להתחבר מחדש." });
        }
      });
      socket.on(LIVE_ROOM_STATUS, (status: RoomStatus) => {
        set((state) => ({
          statuses: state.statuses.map((item) =>
            item.roomId === status.roomId ? status : item,
          ),
        }));
      });
      socket.on(LIVE_ALERT, (alert: Alert) => {
        set((state) => ({ alerts: [alert, ...state.alerts] }));
        const { setAlertToast, setMessageToast } = useToastStore.getState();
        if (alert.type === "room_silent") {
          setAlertToast(alert.message);
        } else {
          setMessageToast(alert.message);
        }
      });
    },

    setStopStatusLive: () => {
      socket?.disconnect();
      socket = null;
      set({ statuses: [], alerts: [] });
    },

    setAlertRead: async (id) => {
      try {
        replaceAlert(await markAlertRead(id));
      } catch (err) {
        set({ error: getErrorDetails(err, "לא הצלחתי לסמן את ההתראה") });
      }
    },

    setAllAlertsRead: async () => {
      const unread = get().alerts.filter((alert) => !alert.readAt);
      try {
        const alerts = await Promise.all(
          unread.map((alert) => markAlertRead(alert.id)),
        );
        alerts.forEach(replaceAlert);
      } catch (err) {
        set({ error: getErrorDetails(err, "לא הצלחתי לסמן את ההתראות") });
      }
    },
  };
});
