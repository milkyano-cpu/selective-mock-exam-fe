import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessTokenExpiresAt: string | null;
  sessionExpiresAt: string | null;
  setAuth: (user: User) => void;
  setAccessTokenExpiry: (accessTokenExpiresAt: string | null) => void;
  setSessionExpiry: (sessionExpiresAt: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessTokenExpiresAt: null,
  sessionExpiresAt: null,
  setAuth: (user) => set({ user }),
  setAccessTokenExpiry: (accessTokenExpiresAt) => set({ accessTokenExpiresAt }),
  setSessionExpiry: (sessionExpiresAt) => set({ sessionExpiresAt }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : state.user,
    })),
  clearAuth: () => {
    try { sessionStorage.removeItem('aspire.pwa.installDismissed'); } catch (_) { /* ignore */ }
    set({ user: null, accessTokenExpiresAt: null, sessionExpiresAt: null });
  },
}));
