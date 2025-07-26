/**
 * Custom session handling for Electron apps
 * This handles the session token storage and retrieval since cookies don't work reliably in Electron
 */

interface SessionData {
  token: string;
  user: any;
  expiresAt: number;
}

class ElectronSessionManager {
  private storageKey = 'vibes_session';

  // Store session data in localStorage
  setSession(data: SessionData) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Get session data from localStorage
  getSession(): SessionData | null {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;

    try {
      const data = JSON.parse(stored) as SessionData;
      
      // Check if session is expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        this.clearSession();
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to parse session data:', error);
      this.clearSession();
      return null;
    }
  }

  // Clear session data
  clearSession() {
    localStorage.removeItem(this.storageKey);
  }

  // Check if session exists and is valid
  hasValidSession(): boolean {
    const session = this.getSession();
    return session !== null;
  }

  // Get the session token for API requests
  getSessionToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }
}

export const sessionManager = new ElectronSessionManager();

// Custom fetch wrapper that includes session token
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = sessionManager.getSessionToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
