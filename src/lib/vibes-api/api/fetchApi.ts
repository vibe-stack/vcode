import { env } from '@/config/environment';

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

  return fetch(finalUrl, {
    ...options,
    credentials: 'include', // Include cookies for session management
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};
