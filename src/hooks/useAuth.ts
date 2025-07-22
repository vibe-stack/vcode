import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/stores/auth';

export function useAuth() {
  const store = useAuthStore();

  const signIn = useCallback(async (email: string, password: string) => {
    return await store.signIn(email, password);
  }, [store]);

  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    return await store.signUp(email, password, username);
  }, [store]);

  const signInWithProvider = useCallback(async (provider: 'github' | 'twitter') => {
    return await store.signInWithProvider(provider);
  }, [store]);

  const signOut = useCallback(async () => {
    await store.signOut();
  }, [store]);

  const refreshSession = useCallback(async () => {
    await store.getSession();
  }, [store]);

  return {
    // State
    user: store.user,
    isLoading: store.isLoading,
    error: store.error,
    isAuthenticated: !!store.user,

    // Actions
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    refreshSession,
    clearError: store.clearError,
  };
}

export type UseAuthReturn = ReturnType<typeof useAuth>;
