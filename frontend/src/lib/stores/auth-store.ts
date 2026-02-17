import { create } from "zustand";
import { SessionUser } from "@/types/job";
import { fetchSession, logout as apiLogout } from "@/lib/api/client";

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  checkSession: async () => {
    try {
      const { user } = await fetchSession();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    set({ user: null });
  },
}));
