import { create } from "zustand";
import type { Room, RoomInput } from "../types/room";
import type { Device, DeviceInput } from "../types/device";
import type { ManagedUser, ManagedUserInput } from "../types/user";
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
  updateDevice,
} from "../api/devices.api";
import { deleteUser, getUsers, updateUser } from "../api/users.api";
import { getErrorDetails } from "../utils/getErrorDetails";
import { useToastStore } from "./toastStore";

const showMessage = (text: string) =>
  useToastStore.getState().setMessageToast(text);

interface AdminStore {
  rooms: Room[];
  devices: Device[];
  users: ManagedUser[];
  newDeviceKey: string | null;
  isLoading: boolean;
  error: string | null;
  setAdminData: () => void;
  setNewRoom: (input: RoomInput) => void;
  setEditedRoom: (id: string, input: RoomInput) => void;
  removeRoom: (id: string) => void;
  setNewDevice: (input: DeviceInput) => void;
  setEditedDevice: (id: string, input: DeviceInput) => void;
  setRevokedDevice: (id: string) => void;
  removeDevice: (id: string) => void;
  removeNewDeviceKey: () => void;
  setEditedUser: (id: string, input: ManagedUserInput) => void;
  removeUser: (id: string) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  rooms: [],
  devices: [],
  users: [],
  newDeviceKey: null,
  isLoading: false,
  error: null,

  setAdminData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [rooms, devices, users] = await Promise.all([
        getRooms(),
        getDevices(),
        getUsers(),
      ]);
      set({ rooms, devices, users, isLoading: false });
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
      showMessage(`החדר "${room.name}" נוסף`);
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
      showMessage("החדר נשמר");
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
        users: state.users.map((user) => ({
          ...user,
          roomIds: user.roomIds.filter((roomId) => roomId !== id),
        })),
      }));
      showMessage("החדר נמחק");
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
      showMessage(`המכשיר "${device.name}" נוצר`);
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorDetails(err, "לא הצלחתי ליצור מכשיר"),
      });
    }
  },

  setEditedDevice: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateDevice(id, {
        roomId: input.roomId,
        name: input.name,
      });
      set((state) => ({
        devices: state.devices.map((device) =>
          device.id === id ? updated : device,
        ),
        isLoading: false,
      }));
      showMessage("המכשיר נשמר");
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorDetails(err, "לא הצלחתי לשמור את המכשיר"),
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
      showMessage("המפתח בוטל");
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
      showMessage("המכשיר נמחק");
    } catch (err) {
      set({ error: getErrorDetails(err, "לא הצלחתי למחוק את המכשיר") });
    }
  },

  removeNewDeviceKey: () => set({ newDeviceKey: null }),

  setEditedUser: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await updateUser(id, input);
      set((state) => ({
        users: state.users.map((user) => (user.id === id ? updated : user)),
        isLoading: false,
      }));
      showMessage("המשתמש נשמר");
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorDetails(err, "לא הצלחתי לשמור את המשתמש"),
      });
    }
  },

  removeUser: async (id) => {
    set({ error: null });
    try {
      await deleteUser(id);
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
      }));
      showMessage("המשתמש נמחק");
    } catch (err) {
      set({ error: getErrorDetails(err, "לא הצלחתי למחוק את המשתמש") });
    }
  },
}));
