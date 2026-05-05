import { create } from "zustand";
import { fetchCurrentUser, login as loginRequest, register as registerRequest } from "../api/auth";
import { setHttpAuthToken } from "../api/http";
import { clearStoredToken, getStoredToken, saveToken } from "../lib/secure-store";
import { socket } from "../socket/client";
import type { User } from "../types/user";

type RegisterPayload = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

type AuthStore = {
  token: string | null;
  user: User | null;
  isHydrated: boolean;
  isSubmitting: boolean;
  error: string | null;
  hydrateSession: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ verificationUrl?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
};

const connectSocketForUser = (userId: string) => {
  if (!socket.connected) {
    socket.connect();
  }

  socket.emit("join_app", userId);
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isHydrated: false,
  isSubmitting: false,
  error: null,
  hydrateSession: async () => {
    try {
      const token = await getStoredToken();

      if (!token) {
        set({ token: null, user: null, isHydrated: true });
        return;
      }

      setHttpAuthToken(token);
      const me = await fetchCurrentUser();
      connectSocketForUser(me.user.id);

      set({
        token,
        user: me.user,
        isHydrated: true,
        error: null,
      });
    } catch (error: any) {
      await clearStoredToken();
      setHttpAuthToken(null);
      socket.disconnect();
      set({
        token: null,
        user: null,
        isHydrated: true,
        error: error?.response?.data?.message || error?.message || "Session expired",
      });
    }
  },
  login: async (identifier, password) => {
    set({ isSubmitting: true, error: null });

    try {
      const result = await loginRequest(identifier, password);
      await saveToken(result.token);
      setHttpAuthToken(result.token);
      connectSocketForUser(result.user.id);

      set({
        token: result.token,
        user: result.user,
        isSubmitting: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isSubmitting: false,
        error: error?.response?.data?.message || error?.message || "Login failed",
      });
      throw error;
    }
  },
  register: async (payload) => {
    set({ isSubmitting: true, error: null });

    try {
      const result = await registerRequest(payload);
      set({ isSubmitting: false, error: null });
      return { verificationUrl: result.verificationUrl };
    } catch (error: any) {
      set({
        isSubmitting: false,
        error: error?.response?.data?.message || error?.message || "Registration failed",
      });
      throw error;
    }
  },
  logout: async () => {
    await clearStoredToken();
    setHttpAuthToken(null);
    socket.disconnect();
    set({
      token: null,
      user: null,
      error: null,
    });
  },
  refreshUser: async () => {
    const { token } = get();

    if (!token) {
      return;
    }

    const me = await fetchCurrentUser();
    connectSocketForUser(me.user.id);
    set({ user: me.user });
  },
  clearError: () => set({ error: null }),
}));
