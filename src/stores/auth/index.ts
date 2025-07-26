import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authClient } from '@/lib/vibes-api';
import { sessionManager } from '@/lib/vibes-api/auth/session';

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
          if (data?.user && data?.token) {
            const user = { ...data.user, image: data.user.image ?? undefined };
            
            // Store session data using our custom session manager
            sessionManager.setSession({
              token: data.token,
              user: user,
              expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            });
            
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
          if (data?.user && data?.token) {
            const user = { ...data.user, image: data.user.image ?? undefined };
            
            // Store session data using our custom session manager
            sessionManager.setSession({
              token: data.token,
              user: user,
              expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            });
            
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
          // Clear our custom session storage
          sessionManager.clearSession();
          set({ user: null, isLoading: false });
        }
      },

      getSession: async () => {
        set({ isLoading: true, error: null });
        try {
          // First check our custom session storage
          const storedSession = sessionManager.getSession();
          if (storedSession) {
            set({ user: storedSession.user, isLoading: false });
            return;
          }

          // Fallback to better-auth session check
          const { data, error } = await authClient.getSession();
          if (error) throw new Error(error.message || 'Failed to get session');
          const user = data?.user ? { ...data.user, image: data.user.image ?? undefined } : null;
          set({ user, isLoading: false });
        } catch (error) {
          // If session retrieval fails, clear any stored session
          sessionManager.clearSession();
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
