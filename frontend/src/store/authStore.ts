import { create } from "zustand";
import type { User } from "../types/user";
import { googleLoginRequest, loginRequest, meRequest } from "../api/auth";

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (identifier: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;

  // ✅ NEW (for profile updates)
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),

  login: async (identifier, password) => {
    const data = await loginRequest(identifier, password);

    localStorage.setItem("token", data.token);

    set({
      user: data.user,
      token: data.token,
      isAuthenticated: true,
    });
  },

  loginWithGoogle: async (idToken) => {
    const data = await googleLoginRequest(idToken);

    localStorage.setItem("token", data.token);

    set({
      user: data.user,
      token: data.token,
      isAuthenticated: true,
    });
  },

  fetchMe: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
      return;
    }

    try {
      const data = await meRequest();

      set({
        user: data.user,
        token,
        isAuthenticated: true,
      });
    } catch {
      localStorage.removeItem("token");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  logout: () => {
    localStorage.removeItem("token");

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  // ✅ NEW FUNCTION
  setUser: (user) => {
    set({ user });
  },
}));
