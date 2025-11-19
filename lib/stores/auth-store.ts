import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserInfo } from '../types/auth';

// Helper functions for cookie storage
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof window === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  // URL encode the value to handle special characters in JSON
  const encodedValue = encodeURIComponent(value);
  document.cookie = `${name}=${encodedValue}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Helper to sync auth state to cookie
const syncToCookie = (state: { user: UserInfo | null; accessToken: string | null }) => {
  if (typeof window === 'undefined') return;
  if (state.accessToken && state.user) {
    setCookie('auth-storage', JSON.stringify({ state }), 7);
  } else {
    deleteCookie('auth-storage');
  }
};

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

      setUser: (user) => {
        set({ user });
        // Sync to cookie
        const state = get();
        syncToCookie({ user, accessToken: state.accessToken });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        // Sync to cookie
        const state = get();
        syncToCookie({ user: state.user, accessToken });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
        deleteCookie('auth-storage');
      },

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
