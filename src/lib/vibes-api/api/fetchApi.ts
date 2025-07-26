import { env } from '@/config/environment';
import { sessionManager } from '../auth/session';

export const VIBES_API_URL = env.apiUrl;

// Debug logging
console.log('🌐 API Configuration:', {
  VIBES_API_URL,
  env: env.apiUrl,
  isDev: env.isDevelopment,
});

export const fetchApi = async (path: string, options: RequestInit = {}) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const finalUrl = `${VIBES_API_URL}/${cleanPath}`;

  console.log('🔗 Making API request to:', finalUrl);

  // Get session token for authentication
  const token = sessionManager.getSessionToken();
  
  // Prepare headers
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  // Add authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(finalUrl, {
    ...options,
    credentials: 'include', // Include cookies for session management
    headers,
  });
};
