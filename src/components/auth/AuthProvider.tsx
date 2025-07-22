import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { getSession } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on app start
    getSession();
  }, [getSession]);

  return <>{children}</>;
}
