import { create } from "zustand";
import type { Room, RoomInput } from "../types/room";
import type { Device, DeviceInput } from "../types/device";
import { createRoom, getRooms } from "../api/rooms.api";
import { createDevice, getDevices, revokeDevice } from "../api/devices.api";
import { getErrorDetails } from "../utils/getErrorDetails";

interface AdminStore {
  rooms: Room[];
  devices: Device[];
  newDeviceKey: string | null;
  isLoading: boolean;
  error: string | null;
  setAdminData: () => void;
  setNewRoom: (input: RoomInput) => void;
  setNewDevice: (input: DeviceInput) => void;
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

  removeDevice: async (id) => {
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

  removeNewDeviceKey: () => set({ newDeviceKey: null }),
}));
