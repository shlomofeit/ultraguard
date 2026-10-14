import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import type { Event, EventFilter } from "../types/event";
import type { Room, RoomStatus } from "../types/room";
import { getRooms } from "../api/rooms.api";
import { getEvents } from "../api/events.api";
import { refreshSession } from "../api/auth.api";
import {
  LIVE_EVENT,
  LIVE_ROOM_STATUS,
  LIVE_UNWATCH,
  LIVE_WATCH,
} from "../utils/socketEvents";
import { getErrorDetails } from "../utils/getErrorDetails";
import { matchesFilter } from "../utils/eventFilter";

const LIVE_URL = `${import.meta.env.VITE_API_URL}/live`;

export const MAX_EVENTS = 200;
export const ALL_ROOMS = "all";
const DEFAULT_FILTER: EventFilter = { type: "all", rangeHours: 24 };

interface EventsStore {
  rooms: Room[];
  events: Event[];
  selectedRoomId: string | null;
  isLive: boolean;
  activeByRoom: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  filter: EventFilter;
  setRooms: (roomId: string | null) => void;
  setSelectedRoom: (roomId: string) => void;
  setStopLive: () => void;
  setFilter: (filter: EventFilter) => void;
}

let socket: Socket | null = null;
let hasRetriedLogin = false;

const getWatchedRoomIds = (roomId: string | null, rooms: Room[]) => {
  if (roomId === ALL_ROOMS) {
    return rooms.map((room) => room.id);
  }
  return roomId ? [roomId] : [];
};

export const useEventsStore = create<EventsStore>((set, get) => {
  const connectLive = (): Socket => {
    if (socket) {
      return socket;
    }
    socket = io(LIVE_URL, { withCredentials: true });
    socket.on("connect", () => {
      hasRetriedLogin = false;
      set({ isLive: true });
      const { selectedRoomId, rooms } = get();
      for (const roomId of getWatchedRoomIds(selectedRoomId, rooms)) {
        socket?.emit(LIVE_WATCH, roomId);
      }
    });
    socket.on("disconnect", () => set({ isLive: false, activeByRoom: {} }));
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
        activeByRoom: {
          ...state.activeByRoom,
          [status.roomId]: status.activeDevices,
        },
      }));
    });
    socket.on(LIVE_EVENT, (event: Event) => {
      set((state) => {
        const isDuplicate = state.events.some((item) => item.id === event.id);
        const isWatched =
          state.selectedRoomId === ALL_ROOMS ||
          event.roomId === state.selectedRoomId;
        const isVisible =
          isWatched &&
          matchesFilter(event, state.filter, Date.now());
        if (!isVisible || isDuplicate) {
          return state;
        }
        return { events: [event, ...state.events].slice(0, MAX_EVENTS) };
      });
    });
    return socket;
  };

  return {
    rooms: [],
    events: [],
    selectedRoomId: null,
    isLive: false,
    activeByRoom: {},
    isLoading: false,
    error: null,
    filter: DEFAULT_FILTER,

    setRooms: async (roomId) => {
      set({ isLoading: true, error: null });
      try {
        const rooms = await getRooms();
        set({ rooms, isLoading: false });
        const isKnownRoom = rooms.some((room) => room.id === roomId);
        if (roomId && isKnownRoom) {
          get().setSelectedRoom(roomId);
        } else if (!get().selectedRoomId && rooms.length > 0) {
          get().setSelectedRoom(rooms.length > 1 ? ALL_ROOMS : rooms[0].id);
        }
      } catch (err) {
        set({
          isLoading: false,
          error: getErrorDetails(err, "לא הצלחתי לטעון את החדרים"),
        });
      }
    },

    setSelectedRoom: async (roomId) => {
      const live = connectLive();
      const { selectedRoomId, rooms } = get();
      for (const previousRoomId of getWatchedRoomIds(selectedRoomId, rooms)) {
        live.emit(LIVE_UNWATCH, previousRoomId);
      }
      for (const watchedRoomId of getWatchedRoomIds(roomId, rooms)) {
        live.emit(LIVE_WATCH, watchedRoomId);
      }
      set({
        selectedRoomId: roomId,
        events: [],
        isLoading: true,
        error: null,
      });
      try {
        const events = await getEvents(
          roomId === ALL_ROOMS ? null : roomId,
          get().filter,
        );
        if (get().selectedRoomId === roomId) {
          set({ events, isLoading: false });
        }
      } catch (err) {
        set({
          isLoading: false,
          error: getErrorDetails(err, "לא הצלחתי לטעון את האירועים"),
        });
      }
    },

    setFilter: (filter) => {
      set({ filter });
      const roomId = get().selectedRoomId;
      if (roomId) {
        get().setSelectedRoom(roomId);
      }
    },

    setStopLive: () => {
      socket?.disconnect();
      socket = null;
      set({
        isLive: false,
        activeByRoom: {},
        selectedRoomId: null,
        events: [],
      });
    },
  };
});
