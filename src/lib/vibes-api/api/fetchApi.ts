export const VIBES_API_URL = process.env.API_URL || "http://localhost:3000";

export const fetchApi = async (path: string, options: RequestInit = {}) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const finalUrl = `${VIBES_API_URL}/${cleanPath}`;

  return fetch(finalUrl, {
    ...options,
    credentials: 'include', // Include cookies for session management
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};
