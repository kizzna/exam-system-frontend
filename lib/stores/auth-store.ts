import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserInfo } from '../types/auth';

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: UserInfo) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),

      isAuthenticated: () => {
        const state = get();
        return !!state.accessToken && !!state.user;
      },

      isAdmin: () => {
        const state = get();
        return state.user?.is_admin || false;
      },

      hasPermission: (permission) => {
        // TODO: Implement when permissions API is available
        const state = get();
        return state.user?.is_admin || false;
      },

      hasRole: (role) => {
        // TODO: Implement when roles API is available
        const state = get();
        if (role === 'admin') return state.user?.is_admin || false;
        return false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
