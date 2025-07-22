import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authClient } from '@/lib/vibes-api';

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  image?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithProvider: (provider: 'github' | 'twitter') => Promise<boolean>;
  signUp: (email: string, password: string, username?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  getSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await authClient.signIn.email({ email, password });
          if (error) throw new Error(error.message || 'Sign in failed');
          if (data?.user) {
            const user = { ...data.user, image: data.user.image ?? undefined };
            set({ user, isLoading: false });
            return true;
          }
          throw new Error('Invalid response from server');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign in failed',
            isLoading: false
          });
          return false;
        }
      },

      signInWithProvider: async (provider: 'github' | 'twitter') => {
        set({ isLoading: true, error: null });
        try {
          // Only github is enabled for now
          if (provider === 'github') {
            const { error } = await authClient.signIn.social({ provider: 'github' });
            if (error) throw new Error(error.message || 'GitHub sign in failed');
            // The redirect will happen automatically by better-auth
            return true;
          }
          // Twitter is disabled
          throw new Error('Twitter sign-in is not enabled');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : `${provider} sign in failed`,
            isLoading: false
          });
          return false;
        }
      },

      signUp: async (email: string, password: string, username?: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await authClient.signUp.email({ email, password, name: username || "" });
          if (error) throw new Error(error.message || 'Sign up failed');
          if (data?.user) {
            const user = { ...data.user, image: data.user.image ?? undefined };
            set({ user, isLoading: false });
            return true;
          }
          throw new Error('Invalid response from server');
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Sign up failed',
            isLoading: false
          });
          return false;
        }
      },

      signOut: async () => {
        set({ isLoading: true, error: null });
        try {
          await authClient.signOut();
        } catch (error) {
          console.error('Sign out error:', error);
        } finally {
          set({ user: null, isLoading: false });
        }
      },

      getSession: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await authClient.getSession();
          if (error) throw new Error(error.message || 'Failed to get session');
          const user = data?.user ? { ...data.user, image: data.user.image ?? undefined } : null;
          set({ user, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to get session',
            user: null,
            isLoading: false
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user 
      }),
    }
  )
);
