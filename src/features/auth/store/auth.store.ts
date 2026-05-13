import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  setAuth: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setAuth: (user) => set({ user }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : state.user,
    })),
  clearAuth: () => {
    try { sessionStorage.removeItem('aspire.pwa.installDismissed'); } catch (_) { /* ignore */ }
    set({ user: null });
  },
}));
