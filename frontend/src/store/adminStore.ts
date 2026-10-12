import { create } from "zustand";
import type { Room, RoomInput } from "../types/room";
import type { Device, DeviceInput } from "../types/device";
import {
  createRoom,
  deleteRoom,
  getRooms,
  updateRoom,
} from "../api/rooms.api";
import {
  createDevice,
  deleteDevice,
  getDevices,
  revokeDevice,
} from "../api/devices.api";
import { getErrorDetails } from "../utils/getErrorDetails";

interface AdminStore {
  rooms: Room[];
  devices: Device[];
  newDeviceKey: string | null;
  isLoading: boolean;
  error: string | null;
  setAdminData: () => void;
  setNewRoom: (input: RoomInput) => void;
  setEditedRoom: (id: string, input: RoomInput) => void;
  removeRoom: (id: string) => void;
  setNewDevice: (input: DeviceInput) => void;
  setRevokedDevice: (id: string) => void;
  removeDevice: (id: string) => void;
  removeNewDeviceKey: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  rooms: [],
  devices: [],
  newDeviceKey: null,
  isLoading: false,
  error: null,

  setAdminData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [rooms, devices] = await Promise.all([getRooms(), getDevices()]);
      set({ rooms, devices, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorDetails(err, "לא הצלחתי לטעון את הנתונים"),
      });
    }
  },

  setNewRoom: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const room = await createRoom(input);
      set((state) => ({ rooms: [...state.rooms, room], isLoading: false }));
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorDetails(err, "לא הצלחתי ליצור חדר"),
      });
    }
  },

  setEditedRoom: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateRoom(id, input);
      set((state) => ({
        rooms: state.rooms.map((room) => (room.id === id ? updated : room)),
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorDetails(err, "לא הצלחתי לשנות את שם החדר"),
      });
    }
  },

  removeRoom: async (id) => {
    set({ error: null });
    try {
      await deleteRoom(id);
      set((state) => ({
        rooms: state.rooms.filter((room) => room.id !== id),
        devices: state.devices.filter((device) => device.roomId !== id),
      }));
    } catch (err) {
      set({ error: getErrorDetails(err, "לא הצלחתי למחוק את החדר") });
    }
  },

  setNewDevice: async (input) => {
    set({ isLoading: true, error: null, newDeviceKey: null });
    try {
      const { device, deviceKey } = await createDevice(input);
      set((state) => ({
        devices: [device, ...state.devices],
        newDeviceKey: deviceKey,
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorDetails(err, "לא הצלחתי ליצור מכשיר"),
      });
    }
  },

  setRevokedDevice: async (id) => {
    set({ error: null });
    try {
      const revoked = await revokeDevice(id);
      set((state) => ({
        devices: state.devices.map((device) =>
          device.id === id ? revoked : device,
        ),
      }));
    } catch (err) {
      set({ error: getErrorDetails(err, "לא הצלחתי לבטל את המכשיר") });
    }
  },

  removeDevice: async (id) => {
    set({ error: null });
    try {
      await deleteDevice(id);
      set((state) => ({
        devices: state.devices.filter((device) => device.id !== id),
      }));
    } catch (err) {
      set({ error: getErrorDetails(err, "לא הצלחתי למחוק את המכשיר") });
    }
  },

  removeNewDeviceKey: () => set({ newDeviceKey: null }),
}));
