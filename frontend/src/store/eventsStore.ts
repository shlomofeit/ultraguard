import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import type { Event, EventFilter } from "../types/event";
import type { Room } from "../types/room";
import { getRooms } from "../api/rooms.api";
import { getEvents } from "../api/events.api";
import { LIVE_EVENT, LIVE_UNWATCH, LIVE_WATCH } from "../utils/socketEvents";
import { getErrorDetails } from "../utils/getErrorDetails";
import { matchesFilter } from "../utils/eventFilter";

const LIVE_URL = `${import.meta.env.VITE_API_URL}/live`;

export const MAX_EVENTS = 200;
const DEFAULT_FILTER: EventFilter = { type: "all", rangeHours: 24 };

interface EventsStore {
  rooms: Room[];
  events: Event[];
  selectedRoomId: string | null;
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  filter: EventFilter;
  setRooms: () => void;
  setSelectedRoom: (roomId: string) => void;
  setStopLive: () => void;
  setFilter: (filter: EventFilter) => void;
}

let socket: Socket | null = null;

export const useEventsStore = create<EventsStore>((set, get) => {
  const connectLive = (): Socket => {
    if (socket) {
      return socket;
    }
    socket = io(LIVE_URL, { withCredentials: true });
    socket.on("connect", () => {
      set({ isLive: true });
      const roomId = get().selectedRoomId;
      if (roomId) {
        socket?.emit(LIVE_WATCH, roomId);
      }
    });
    socket.on("disconnect", () => set({ isLive: false }));
    socket.on(LIVE_EVENT, (event: Event) => {
      set((state) => {
        const isDuplicate = state.events.some((item) => item.id === event.id);
        const isVisible =
          event.roomId === state.selectedRoomId &&
          matchesFilter(event, state.filter, Date.now());
        if (!isVisible || isDuplicate) {
          return state;
        }
        if (event.roomId !== state.selectedRoomId || isDuplicate) {
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
    isLoading: false,
    error: null,
    filter: DEFAULT_FILTER,

    setRooms: async () => {
      set({ isLoading: true, error: null });
      try {
        const rooms = await getRooms();
        set({ rooms, isLoading: false });
        if (!get().selectedRoomId && rooms.length > 0) {
          get().setSelectedRoom(rooms[0].id);
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
      const previousRoomId = get().selectedRoomId;
      if (previousRoomId) {
        live.emit(LIVE_UNWATCH, previousRoomId);
      }
      live.emit(LIVE_WATCH, roomId);
      set({ selectedRoomId: roomId, events: [], isLoading: true, error: null });
      try {
        const events = await getEvents(roomId, get().filter);
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
      set({ isLive: false, selectedRoomId: null, events: [] });
    },
  };
});
