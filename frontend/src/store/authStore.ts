import { create } from "zustand";
import type { LoginInput, RegisterInput, User } from "../types/user";
import {
  getMe,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from "../api/auth.api";
import { getErrorDetails } from "../utils/getErrorDetails";

interface AuthStore {
  user: User | null;
  isChecked: boolean;
  isLoading: boolean;
  error: string | null;
  setCheckAuth: () => void;
  setLogin: (input: LoginInput) => void;
  setRegister: (input: RegisterInput) => void;
  setLogout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isChecked: false,
  isLoading: false,
  error: null,

  setCheckAuth: async () => {
    try {
      const user = await getMe();
      set({ user, isChecked: true });
    } catch {
      try {
        const user = await refreshSession();
        set({ user, isChecked: true });
      } catch {
        set({ user: null, isChecked: true });
      }
    }
  },

  setLogin: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const user = await loginUser(input);
      set({ user, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorDetails(err, "ההתחברות נכשלה"),
      });
    }
  },

  setRegister: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const user = await registerUser(input);
      set({ user, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorDetails(err, "ההרשמה נכשלה"),
      });
    }
  },

  setLogout: async () => {
    try {
      await logoutUser();
    } finally {
      set({ user: null, error: null });
    }
  },
}));
